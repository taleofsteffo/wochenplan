"""Generate a validated multilingual weekly meal plan for the PWA."""

from __future__ import annotations

import json
import os
from datetime import date, timedelta
from pathlib import Path
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field, model_validator

ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / "plan.json"
HISTORY_DIR = ROOT / "history"
DAYS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
MEALS = ("breakfast", "lunch", "snack", "dinner")


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class MultiText(StrictModel):
    de: str = Field(min_length=1)
    en: str = Field(min_length=1)
    it: str = Field(min_length=1)


class Target(StrictModel):
    id: str
    value: MultiText
    label: MultiText


class Meal(StrictModel):
    id: Literal["breakfast", "lunch", "snack", "dinner"]
    label: MultiText
    text: MultiText
    wholeEggs: int = Field(ge=0, le=2)
    fish: bool
    legumes: bool
    processedMeat: bool


class DayPlan(StrictModel):
    id: Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    label: MultiText
    calories: MultiText
    meals: list[Meal] = Field(min_length=4, max_length=4)

    @model_validator(mode="after")
    def validate_meal_order(self):
        if tuple(meal.id for meal in self.meals) != MEALS:
            raise ValueError("Meal IDs must be breakfast, lunch, snack and dinner in that order.")
        return self


class PrepBlock(StrictModel):
    id: str
    title: MultiText
    steps: list[MultiText] = Field(min_length=3, max_length=8)


class ShoppingItem(StrictModel):
    id: str
    text: MultiText


class ShoppingGroup(StrictModel):
    id: str
    category: MultiText
    items: list[ShoppingItem] = Field(min_length=1, max_length=30)


class WeekRange(StrictModel):
    start: str
    end: str


class WeeklyPlan(StrictModel):
    version: Literal[2]
    updated: str
    week: WeekRange
    appTitle: MultiText
    weekLabel: MultiText
    intro: MultiText
    targets: list[Target] = Field(min_length=4, max_length=4)
    days: list[DayPlan] = Field(min_length=7, max_length=7)
    mealPrep: list[PrepBlock] = Field(min_length=2, max_length=3)
    shopping: list[ShoppingGroup] = Field(min_length=4, max_length=10)
    medicalNote: MultiText

    @model_validator(mode="after")
    def validate_day_order(self):
        if tuple(day.id for day in self.days) != DAYS:
            raise ValueError("Day IDs must be Monday through Sunday in order.")
        return self


def next_monday(today: date) -> date:
    offset = (7 - today.weekday()) % 7
    return today + timedelta(days=offset or 7)


def previous_meals() -> str:
    if not PLAN_PATH.exists():
        return "No previous plan."
    try:
        old = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
        return "\n".join(
            f"{day['id']} {meal['id']}: {meal['text']['de']}"
            for day in old.get("days", [])
            for meal in day.get("meals", [])
        )
    except Exception:
        return "Previous plan unavailable."


def validate_semantics(plan: WeeklyPlan) -> None:
    meals = [meal for day in plan.days for meal in day.meals]
    eggs = sum(meal.wholeEggs for meal in meals)
    fish = sum(meal.fish for meal in meals)
    legumes = sum(meal.legumes for meal in meals)

    if eggs > 2:
        raise ValueError(f"Too many whole eggs: {eggs}")
    if not 2 <= fish <= 3:
        raise ValueError(f"Fish meals must be 2 or 3, found {fish}")
    if legumes < 4:
        raise ValueError(f"At least 4 legume meals are required, found {legumes}")
    if any(meal.processedMeat for meal in meals):
        raise ValueError("Processed meat is not allowed")

    item_ids = [item.id for group in plan.shopping for item in group.items]
    if len(item_ids) != len(set(item_ids)):
        raise ValueError("Shopping item IDs must be unique")


def prompt(monday: date, sunday: date, previous: str, correction: str = "") -> str:
    retry = f"\nCorrect this validation failure: {correction}\n" if correction else ""
    return f"""
Create a complete multilingual Mediterranean meal plan for one adult for
{monday.isoformat()} through {sunday.isoformat()}.

Every user-visible string must be supplied in natural German, English and Italian.
Do not translate literally when normal food terminology differs by language.

Health and practical constraints:
- Approximately 2,000–2,100 kcal per day.
- No gym training currently; normal everyday movement.
- Family history of diabetes, high LDL/cholesterol disorders and cardiovascular disease.
- Maximum 2 whole eggs in the entire week.
- 2 or 3 fish meals, including at least one oily fish meal.
- At least 4 meals with legumes.
- No processed meat, sausage, bacon or salami.
- Low saturated fat, mostly low-fat dairy and small cheese portions.
- Emphasise oats, whole grains, vegetables, fruit, legumes, nuts and measured olive oil.
- Mediterranean and Italian style.
- Avoid onion- or garlic-heavy recipes.
- Low active preparation time, with intelligent leftovers and meal prep.
- Exact practical quantities for one person.
- State pasta, rice and couscous as dry/uncooked quantities in all three languages.
- Seven days in exact ID order Monday through Sunday.
- Four meals per day in exact ID order breakfast, lunch, snack, dinner.
- Shopping list must match the recipes and use stable short English IDs.
- Use different main dishes from the previous week when practical.

Previous German meal descriptions:
{previous}

Use a generic app title so Stefano's friends can use the app.
The medical note must state that the plan does not replace medical advice.
{retry}
""".strip()


def generate() -> WeeklyPlan:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing")

    model = os.environ.get("OPENAI_MODEL", "gpt-5.6-luna")
    today = date.today()
    monday = next_monday(today)
    sunday = monday + timedelta(days=6)
    client = OpenAI(api_key=api_key)
    correction = ""

    for _attempt in range(3):
        response = client.responses.parse(
            model=model,
            input=[
                {
                    "role": "developer",
                    "content": (
                        "Create accurate, practical and culturally natural multilingual meal plans. "
                        "Follow the schema and quantitative constraints exactly."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt(monday, sunday, previous_meals(), correction),
                },
            ],
            text_format=WeeklyPlan,
        )
        plan = response.output_parsed
        if plan is None:
            correction = "No parsed output was returned"
            continue

        plan.version = 2
        plan.updated = today.isoformat()
        plan.week = WeekRange(start=monday.isoformat(), end=sunday.isoformat())

        try:
            validate_semantics(plan)
            return plan
        except ValueError as exc:
            correction = str(exc)

    raise RuntimeError(f"Could not create a valid plan: {correction}")


def save(plan: WeeklyPlan) -> None:
    HISTORY_DIR.mkdir(exist_ok=True)
    data = plan.model_dump_json(indent=2) + "\n"
    PLAN_PATH.write_text(data, encoding="utf-8")
    year, week, _ = date.fromisoformat(plan.week.start).isocalendar()
    (HISTORY_DIR / f"{year}-W{week:02d}.json").write_text(data, encoding="utf-8")


if __name__ == "__main__":
    save(generate())
