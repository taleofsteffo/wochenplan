"""Research current weekly grocery prices for both configured markets.

The script reads the current plan.json and market-config.json, uses the OpenAI
Responses API with live web search, validates the result, and writes offers.json.
Only offers with a clickable source URL are treated as found.
"""

from __future__ import annotations

import json
import os
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field, model_validator

ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / "plan.json"
CONFIG_PATH = ROOT / "market-config.json"
OFFERS_PATH = ROOT / "offers.json"
HISTORY_DIR = ROOT / "history" / "offers"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class MultiText(StrictModel):
    de: str
    en: str
    it: str


class Store(StrictModel):
    id: str
    name: str
    city: str | None
    address: str | None


class Selection(StrictModel):
    shoppingItemId: str
    found: bool
    productName: str | None
    storeName: str | None
    storeAddress: str | None
    price: float | None = Field(ge=0)
    packageSize: str | None
    unitPrice: str | None
    quantityNeeded: str | None
    estimatedCost: float | None = Field(ge=0)
    loyaltyRequired: bool
    loyaltyProgram: str | None
    validFrom: str | None
    validTo: str | None
    sourceUrl: str | None
    sourceTitle: str | None
    confidence: Literal["high", "medium", "low"]
    note: str | None

    @model_validator(mode="after")
    def found_requires_evidence(self):
        if self.found:
            required = [
                self.productName,
                self.storeName,
                self.price,
                self.sourceUrl,
                self.sourceTitle,
            ]
            if any(value is None for value in required):
                raise ValueError("Found selections require product, store, price and source.")
            parsed = urlparse(self.sourceUrl or "")
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("sourceUrl must be a valid HTTP(S) URL.")
        return self


class Scenario(StrictModel):
    includeLoyalty: bool
    estimatedTotal: float = Field(ge=0)
    selectedStoreCount: int = Field(ge=0, le=6)
    coveredItems: int = Field(ge=0)
    totalItems: int = Field(ge=1)
    selectedStores: list[Store] = Field(max_length=6)
    selections: list[Selection] = Field(min_length=1)


class CountryOffers(StrictModel):
    country: Literal["DE", "IT"]
    locationLabel: str
    radiusKm: int = Field(ge=1, le=50)
    currency: Literal["EUR"]
    validFrom: str | None
    validTo: str | None
    searchedRetailers: list[str]
    withLoyalty: Scenario
    withoutLoyalty: Scenario
    statusText: MultiText

    @model_validator(mode="after")
    def scenarios_match(self):
        if not self.withLoyalty.includeLoyalty:
            raise ValueError("withLoyalty must include loyalty offers.")
        if self.withoutLoyalty.includeLoyalty:
            raise ValueError("withoutLoyalty must exclude loyalty offers.")
        return self


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def shopping_items(plan: dict) -> list[dict]:
    items = []
    for group in plan["shopping"]:
        for item in group["items"]:
            items.append(
                {
                    "id": item["id"],
                    "de": item["text"]["de"],
                    "en": item["text"]["en"],
                    "it": item["text"]["it"],
                }
            )
    return items


def semantic_validate(result: CountryOffers, item_ids: list[str], max_stores: int) -> None:
    expected = set(item_ids)
    for scenario in (result.withLoyalty, result.withoutLoyalty):
        actual = [selection.shoppingItemId for selection in scenario.selections]
        if len(actual) != len(set(actual)):
            raise ValueError("Duplicate shoppingItemId in scenario.")
        if set(actual) != expected:
            missing = expected - set(actual)
            extra = set(actual) - expected
            raise ValueError(f"Scenario IDs mismatch. Missing={missing}, extra={extra}")
        if scenario.selectedStoreCount != len(scenario.selectedStores):
            raise ValueError("selectedStoreCount does not match selectedStores.")
        if scenario.selectedStoreCount > max_stores:
            raise ValueError("Too many selected stores.")
        found_count = sum(selection.found for selection in scenario.selections)
        if scenario.coveredItems != found_count:
            raise ValueError("coveredItems does not match found selections.")
        if scenario.totalItems != len(item_ids):
            raise ValueError("totalItems does not match shopping list.")
        if not scenario.includeLoyalty:
            if any(selection.found and selection.loyaltyRequired for selection in scenario.selections):
                raise ValueError("Loyalty offer found in withoutLoyalty scenario.")


def build_prompt(market: dict, items: list[dict], max_stores: int, correction: str = "") -> str:
    country_name = "Germany" if market["country"] == "DE" else "Italy"
    local_language = "German" if market["country"] == "DE" else "Italian"
    item_lines = "\n".join(
        f"- {item['id']}: {item['de'] if market['country']=='DE' else item['it']}"
        for item in items
    )
    correction_text = f"\nCorrect this validation problem: {correction}\n" if correction else ""

    return f"""
Research current supermarket prices and weekly promotions for the exact grocery
shopping list below in {country_name}, centred on:

- Postal code: {market['postalCode']}
- City: {market['city']}
- Region: {market['region']}
- Search radius: approximately {market['radiusKm']} km
- Maximum stores in the recommended basket: {max_stores}
- Retailers: all normal supermarkets and discounters with relevant stores or
  regionally valid offers.

Shopping list:
{item_lines}

Create two complete scenarios:
1. withLoyalty: loyalty-card, coupon and retailer-app prices may be used.
2. withoutLoyalty: use no price that requires an app, login, coupon or loyalty card.

Rules:
- Search the live web. Prefer official retailer product pages, official local
  flyers and official offer pages. Reputable flyer aggregators may be used when
  the retailer source is inaccessible.
- The offer or price must be applicable during the current shopping week.
- Use local or regionally applicable prices where possible.
- Never invent a price, branch, address, validity period, pack size, URL or source.
- A selection may be marked found only when it has a clickable source URL that
  supports the product and price.
- If no reliable current price is found, set found=false and explain briefly in note.
- Match comparable products rather than forcing an exact brand, unless the shopping
  list itself names a brand.
- Compare package price and unit price. Account for the required quantity when
  estimating cost.
- Use at most {max_stores} stores in each scenario. Optimise the practical basket,
  not a route visiting dozens of shops for tiny savings.
- Each scenario must contain exactly one selection for every shoppingItemId, in
  the same order as the supplied list.
- selectedStores may include only stores used by at least one found selection.
- estimatedTotal is the sum of estimatedCost for found items only; missing items
  are not silently assigned a price.
- Write product names and notes in {local_language}. Store names remain official.
- confidence is high for an official retailer source with clear current validity,
  medium for a reputable flyer source or a less-specific regional price, and low
  only when the source is weaker but still directly supports the price.
- statusText must be natural German, English and Italian and explain that this is
  the best reliably sourced result found, not a universal guarantee.
{correction_text}
""".strip()


def research_country(
    client: OpenAI,
    model: str,
    market: dict,
    items: list[dict],
    max_stores: int,
) -> CountryOffers:
    correction = ""
    user_location = {
        "type": "approximate",
        "country": market["country"],
        "city": market["city"],
        "region": market["region"],
        "timezone": market["timezone"],
    }

    for _attempt in range(3):
        response = client.responses.parse(
            model=model,
            reasoning={"effort": "medium"},
            tools=[
                {
                    "type": "web_search",
                    "search_context_size": "high",
                    "external_web_access": True,
                    "user_location": user_location,
                }
            ],
            tool_choice="required",
            input=[
                {
                    "role": "developer",
                    "content": (
                        "You are a cautious grocery price researcher. Use live web "
                        "search and never present an unsourced price as verified. "
                        "Return the structured result exactly."
                    ),
                },
                {
                    "role": "user",
                    "content": build_prompt(market, items, max_stores, correction),
                },
            ],
            text_format=CountryOffers,
        )
        result = response.output_parsed
        if result is None:
            correction = "No parsed result was returned."
            continue
        try:
            semantic_validate(result, [item["id"] for item in items], max_stores)
            return result
        except ValueError as exc:
            correction = str(exc)

    raise RuntimeError(
        f"Could not create valid offers for {market['country']}: {correction}"
    )


def main() -> None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing.")

    plan = load_json(PLAN_PATH)
    config = load_json(CONFIG_PATH)
    items = shopping_items(plan)
    max_stores = int(config["maxStores"])
    model = os.environ.get("OFFER_MODEL", "gpt-5.6-terra")
    client = OpenAI(api_key=api_key)

    markets = {}
    for country in ("DE", "IT"):
        result = research_country(
            client,
            model,
            config["markets"][country],
            items,
            max_stores,
        )
        markets[country] = result.model_dump(mode="json")

    output = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "markets": markets,
    }
    data = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    OFFERS_PATH.write_text(data, encoding="utf-8")

    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    year, week, _ = date.today().isocalendar()
    (HISTORY_DIR / f"{year}-W{week:02d}.json").write_text(data, encoding="utf-8")


if __name__ == "__main__":
    main()
