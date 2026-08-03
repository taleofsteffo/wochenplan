
const STORAGE="med-meal-plan-v3:";
const LANGS=["de","en","it"];
let currentPlan=null;
let currentOffers=null;
let currentLang=chooseInitialLanguage();

const ui={
de:{
  eyebrow:"MEDITERRAN · HERZFREUNDLICH",language:"Sprache",
  installTitle:"Als App installieren",installText:"In Safari: Teilen → „Zum Home-Bildschirm“ → „Als Web-App öffnen“.",ok:"OK",
  plan:"Plan",shopping:"Einkauf",offers:"Angebote",prep:"Meal-Prep",notes:"Notizen",
  shoppingSubtitle:"Häkchen bleiben auf diesem Gerät gespeichert.",reset:"Zurücksetzen",
  prepSubtitle:"Wenig tägliche Küchenzeit, mehr Leben.",notesSubtitle:"Vorlieben, Änderungen oder Gewichtsentwicklung.",
  notesPlaceholder:"Notizen werden lokal auf diesem Gerät gespeichert …",medicalPrefix:"Hinweis:",
  updated:"Aktualisiert",print:"Drucken / PDF",refreshError:"Keine neuen Daten erreichbar. Die gespeicherte Version bleibt verfügbar.",
  refreshAria:"Plan und Angebote aktualisieren",sectionsAria:"Bereiche",
  offersSubtitle:"Beste zuverlässig gefundene Wochenpreise passend zur Einkaufsliste.",
  offerRegion:"Preisregion",loyaltyTitle:"App- und Kartenangebote einbeziehen",
  loyaltyHelp:"Kann Kundenkonto, Coupon oder Händler-App erfordern.",
  basket:"Geschätzter Warenkorb",coverage:"Gefundene Artikel",stores:"Geschäfte",validity:"Gültigkeit",
  noOffers:"Für diese Region sind noch keine Preisdaten vorhanden.",source:"Quelle öffnen",
  estimatedCost:"Bedarf ca.",unitPrice:"Grundpreis",package:"Packung",confidence:"Verlässlichkeit",
  high:"hoch",medium:"mittel",low:"niedrig",loyalty:"App/Karte",regular:"ohne Kundenkarte",
  missing:"Kein zuverlässiger aktueller Preis gefunden.",
  disclaimer:"Preise und Verfügbarkeit können sich lokal ändern. Vergleiche im Laden den Grundpreis und die Gültigkeit. Die App zeigt nur Preise, die mit einer anklickbaren Quelle belegt wurden.",
  notGuaranteed:"„Günstigster Preis“ bedeutet: günstigster zuverlässig gefundener und belegter Preis innerhalb der Suche – nicht eine Garantie über jeden einzelnen Markt."
},
en:{
  eyebrow:"MEDITERRANEAN · HEART-FRIENDLY",language:"Language",
  installTitle:"Install as an app",installText:"In Safari: Share → Add to Home Screen → Open as Web App.",ok:"OK",
  plan:"Plan",shopping:"Shopping",offers:"Deals",prep:"Meal Prep",notes:"Notes",
  shoppingSubtitle:"Your checkmarks stay saved on this device.",reset:"Reset",
  prepSubtitle:"Less daily kitchen time, more life.",notesSubtitle:"Preferences, changes or weight progress.",
  notesPlaceholder:"Notes are stored locally on this device …",medicalPrefix:"Note:",
  updated:"Updated",print:"Print / PDF",refreshError:"No new data could be reached. The saved version remains available.",
  refreshAria:"Refresh plan and deals",sectionsAria:"Sections",
  offersSubtitle:"Best reliably found weekly prices matching the shopping list.",
  offerRegion:"Price region",loyaltyTitle:"Include app and loyalty-card prices",
  loyaltyHelp:"May require an account, coupon or retailer app.",
  basket:"Estimated basket",coverage:"Items found",stores:"Stores",validity:"Validity",
  noOffers:"No price data is available for this region yet.",source:"Open source",
  estimatedCost:"Needed quantity approx.",unitPrice:"Unit price",package:"Pack",confidence:"Confidence",
  high:"high",medium:"medium",low:"low",loyalty:"App/card",regular:"no loyalty card",
  missing:"No reliable current price was found.",
  disclaimer:"Prices and availability can vary locally. Check the unit price and validity in store. The app displays only prices backed by a clickable source.",
  notGuaranteed:"“Best price” means the lowest reliably found and sourced price in the search, not a guarantee across every individual shop."
},
it:{
  eyebrow:"MEDITERRANEO · AMICO DEL CUORE",language:"Lingua",
  installTitle:"Installa come app",installText:"In Safari: Condividi → Aggiungi alla schermata Home → Apri come app web.",ok:"OK",
  plan:"Piano",shopping:"Spesa",offers:"Offerte",prep:"Preparazione",notes:"Note",
  shoppingSubtitle:"Le spunte restano salvate su questo dispositivo.",reset:"Azzera",
  prepSubtitle:"Meno tempo ogni giorno in cucina, più vita.",notesSubtitle:"Preferenze, modifiche o andamento del peso.",
  notesPlaceholder:"Le note vengono salvate localmente su questo dispositivo …",medicalPrefix:"Nota:",
  updated:"Aggiornato",print:"Stampa / PDF",refreshError:"Non è stato possibile raggiungere nuovi dati. La versione salvata resta disponibile.",
  refreshAria:"Aggiorna piano e offerte",sectionsAria:"Sezioni",
  offersSubtitle:"I migliori prezzi settimanali trovati con fonti affidabili, in base alla lista della spesa.",
  offerRegion:"Zona prezzi",loyaltyTitle:"Includi offerte con app e carta fedeltà",
  loyaltyHelp:"Può richiedere account, coupon o app del supermercato.",
  basket:"Carrello stimato",coverage:"Articoli trovati",stores:"Negozi",validity:"Validità",
  noOffers:"Non sono ancora disponibili dati sui prezzi per questa zona.",source:"Apri la fonte",
  estimatedCost:"Fabbisogno circa",unitPrice:"Prezzo unitario",package:"Confezione",confidence:"Affidabilità",
  high:"alta",medium:"media",low:"bassa",loyalty:"App/carta",regular:"senza carta",
  missing:"Nessun prezzo attuale affidabile trovato.",
  disclaimer:"Prezzi e disponibilità possono variare localmente. Controlla in negozio il prezzo unitario e la validità. L’app mostra solo prezzi accompagnati da una fonte cliccabile.",
  notGuaranteed:"“Miglior prezzo” indica il prezzo più basso trovato e documentato nella ricerca, non una garanzia su ogni singolo supermercato."
}
};

function chooseInitialLanguage(){
  const saved=localStorage.getItem(STORAGE+"language") || localStorage.getItem("med-meal-plan-v2:language");
  if(LANGS.includes(saved)) return saved;
  const browser=(navigator.language||"en").slice(0,2).toLowerCase();
  return LANGS.includes(browser)?browser:"en";
}
function text(value){
  if(value&&typeof value==="object") return value[currentLang]??value.en??value.de??Object.values(value)[0]??"";
  return value??"";
}
function defaultCountry(){
  const saved=localStorage.getItem(STORAGE+"offerCountry");
  if(["DE","IT"].includes(saved)) return saved;
  return currentLang==="it"?"IT":"DE";
}
async function fetchJson(name,forceNetwork=false){
  const url=forceNetwork?`${name}?refresh=${Date.now()}`:name;
  const response=await fetch(url,{cache:forceNetwork?"no-store":"default"});
  if(!response.ok) throw new Error(`${name}-load-failed`);
  return response.json();
}
async function loadData(forceNetwork=false){
  const [plan,offers]=await Promise.all([
    fetchJson("plan.json",forceNetwork),
    fetchJson("offers.json",forceNetwork).catch(()=>null)
  ]);
  currentPlan=plan;
  currentOffers=offers;
  renderAll();
}
function renderAll(){
  if(!currentPlan) return;
  const t=ui[currentLang];
  document.documentElement.lang=currentLang;
  document.title=text(currentPlan.appTitle);
  document.querySelector(".eyebrow").textContent=t.eyebrow;
  document.getElementById("appTitle").textContent=text(currentPlan.appTitle);
  document.getElementById("weekLabel").textContent=text(currentPlan.weekLabel);
  document.getElementById("intro").textContent=text(currentPlan.intro);
  document.getElementById("languageLabel").textContent=t.language;
  document.getElementById("languageSelect").value=currentLang;
  document.getElementById("languageSelect").setAttribute("aria-label",t.language);
  document.getElementById("refreshButton").setAttribute("aria-label",t.refreshAria);
  document.querySelector(".tabs").setAttribute("aria-label",t.sectionsAria);
  document.getElementById("installTitle").textContent=t.installTitle;
  document.getElementById("installText").textContent=t.installText;
  document.getElementById("closeInstallHint").textContent=t.ok;
  document.getElementById("tabPlan").textContent=t.plan;
  document.getElementById("tabShopping").textContent=t.shopping;
  document.getElementById("tabOffers").textContent=t.offers;
  document.getElementById("tabPrep").textContent=t.prep;
  document.getElementById("tabNotes").textContent=t.notes;
  document.getElementById("shoppingTitle").textContent=t.shopping;
  document.getElementById("shoppingSubtitle").textContent=t.shoppingSubtitle;
  document.getElementById("resetShopping").textContent=t.reset;
  document.getElementById("prepTitle").textContent=t.prep;
  document.getElementById("prepSubtitle").textContent=t.prepSubtitle;
  document.getElementById("notesTitle").textContent=t.notes;
  document.getElementById("notesSubtitle").textContent=t.notesSubtitle;
  document.getElementById("notes").placeholder=t.notesPlaceholder;
  document.getElementById("medicalPrefix").textContent=t.medicalPrefix+" ";
  document.getElementById("medicalText").textContent=text(currentPlan.medicalNote);
  document.getElementById("printButton").textContent=t.print;
  document.getElementById("updated").textContent=`${t.updated}: ${formatDate(currentPlan.updated)}`;
  document.getElementById("offersTitle").textContent=t.offers;
  document.getElementById("offersSubtitle").textContent=t.offersSubtitle;
  document.getElementById("offerRegionLabel").textContent=t.offerRegion;
  document.getElementById("loyaltyTitle").textContent=t.loyaltyTitle;
  document.getElementById("loyaltyHelp").textContent=t.loyaltyHelp;

  document.getElementById("summary").innerHTML=currentPlan.targets.map(metric=>
    `<div class="metric"><strong>${escapeHtml(text(metric.value))}</strong><span>${escapeHtml(text(metric.label))}</span></div>`
  ).join("");

  document.getElementById("days").innerHTML=currentPlan.days.map(day=>`
    <article class="day">
      <h2>${escapeHtml(text(day.label))}<span>${escapeHtml(text(day.calories))}</span></h2>
      ${day.meals.map(meal=>`<div class="meal"><strong>${escapeHtml(text(meal.label))}</strong><p>${escapeHtml(text(meal.text))}</p></div>`).join("")}
    </article>`).join("");

  document.getElementById("prep").innerHTML=currentPlan.mealPrep.map(block=>`
    <article class="prep-card"><h3>${escapeHtml(text(block.title))}</h3>
    <ol>${block.steps.map(step=>`<li>${escapeHtml(text(step))}</li>`).join("")}</ol></article>`).join("");

  document.getElementById("shopping").innerHTML=currentPlan.shopping.map(group=>`
    <section class="shop-group"><h3>${escapeHtml(text(group.category))}</h3><ul class="checklist">
    ${group.items.map(item=>{
      const checkboxId=`shop-${group.id}-${item.id}`;
      return `<li><input id="${escapeAttr(checkboxId)}" data-item-id="${escapeAttr(item.id)}" type="checkbox"><label for="${escapeAttr(checkboxId)}">${escapeHtml(text(item.text))}</label></li>`;
    }).join("")}</ul></section>`).join("");
  restoreChecklist();

  const countrySelect=document.getElementById("offerCountry");
  if(!["DE","IT"].includes(countrySelect.value)) countrySelect.value=defaultCountry();
  if(!localStorage.getItem(STORAGE+"offerCountry")) countrySelect.value=defaultCountry();
  renderOffers();
}
function shoppingItemMap(){
  const map={};
  currentPlan.shopping.forEach(group=>group.items.forEach(item=>map[item.id]=text(item.text)));
  return map;
}
function renderOffers(){
  const t=ui[currentLang];
  const country=document.getElementById("offerCountry").value || defaultCountry();
  const includeLoyalty=document.getElementById("includeLoyalty").checked;
  const market=currentOffers?.markets?.[country];
  const status=document.getElementById("offerStatus");
  const summary=document.getElementById("offerSummary");
  const stores=document.getElementById("offerStores");
  const items=document.getElementById("offerItems");
  const disclaimer=document.getElementById("offerDisclaimer");

  status.innerHTML="";
  summary.innerHTML="";
  stores.innerHTML="";
  items.innerHTML="";
  disclaimer.innerHTML="";

  if(!market){
    status.textContent=t.noOffers;
    return;
  }
  const scenario=includeLoyalty?market.withLoyalty:market.withoutLoyalty;
  if(!scenario){
    status.textContent=text(market.statusText)||t.noOffers;
    disclaimer.textContent=t.notGuaranteed;
    return;
  }

  const validity=[formatDate(market.validFrom),formatDate(market.validTo)].filter(Boolean).join(" – ");
  summary.innerHTML=[
    [formatMoney(scenario.estimatedTotal,market.currency),t.basket],
    [`${scenario.coveredItems}/${scenario.totalItems}`,t.coverage],
    [String(scenario.selectedStoreCount),t.stores],
    [validity||"—",t.validity]
  ].map(([value,label])=>`<div class="offer-stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");

  stores.innerHTML=(scenario.selectedStores||[]).map(store=>
    `<span class="store-chip">${escapeHtml(store.name)}${store.city?` · ${escapeHtml(store.city)}`:""}</span>`
  ).join("");

  const labels=shoppingItemMap();
  items.innerHTML=(scenario.selections||[]).map(selection=>{
    const itemLabel=labels[selection.shoppingItemId]||selection.shoppingItemId;
    if(!selection.found){
      return `<article class="offer-card offer-missing"><div class="offer-card-head"><h3>${escapeHtml(itemLabel)}</h3></div><p>${escapeHtml(selection.note||t.missing)}</p></article>`;
    }
    const badges=[
      selection.packageSize?`${t.package}: ${selection.packageSize}`:"",
      selection.unitPrice?`${t.unitPrice}: ${selection.unitPrice}`:"",
      selection.loyaltyRequired?t.loyalty:t.regular,
      selection.confidence?`${t.confidence}: ${t[selection.confidence]||selection.confidence}`:""
    ].filter(Boolean);
    return `<article class="offer-card">
      <div class="offer-card-head"><div><h3>${escapeHtml(itemLabel)}</h3><p class="offer-product">${escapeHtml(selection.productName||"")}</p></div><div class="offer-price">${formatMoney(selection.price,market.currency)}</div></div>
      <div class="offer-meta">${badges.map((badge,index)=>`<span class="offer-badge ${selection.loyaltyRequired&&index===2?"loyalty":""}">${escapeHtml(badge)}</span>`).join("")}</div>
      ${selection.quantityNeeded||selection.estimatedCost?`<p>${escapeHtml(t.estimatedCost)}: ${escapeHtml(selection.quantityNeeded||"—")} · ${formatMoney(selection.estimatedCost,market.currency)}</p>`:""}
      <p><strong>${escapeHtml(selection.storeName||"")}</strong>${selection.storeAddress?` · ${escapeHtml(selection.storeAddress)}`:""}</p>
      ${selection.sourceUrl?`<a class="offer-source" href="${escapeAttr(selection.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.source)} ↗</a>`:""}
    </article>`;
  }).join("");

  status.textContent=`${market.locationLabel} · ${market.radiusKm} km`;
  disclaimer.textContent=`${t.notGuaranteed} ${t.disclaimer}`;
}
function restoreChecklist(){
  document.querySelectorAll(".checklist input").forEach(input=>{
    const key=STORAGE+"shop:"+input.dataset.itemId;
    const legacy="med-meal-plan-v2:shop:"+input.dataset.itemId;
    input.checked=localStorage.getItem(key)==="true" || localStorage.getItem(legacy)==="true";
    updateCheckLabel(input);
    input.addEventListener("change",()=>{
      localStorage.setItem(key,String(input.checked));
      updateCheckLabel(input);
    });
  });
}
function updateCheckLabel(input){
  document.querySelector(`label[for="${input.id}"]`)?.classList.toggle("done",input.checked);
}
document.getElementById("languageSelect").addEventListener("change",event=>{
  currentLang=event.target.value;
  localStorage.setItem(STORAGE+"language",currentLang);
  if(!localStorage.getItem(STORAGE+"offerCountry")){
    document.getElementById("offerCountry").value=currentLang==="it"?"IT":"DE";
  }
  renderAll();
});
document.getElementById("offerCountry").addEventListener("change",event=>{
  localStorage.setItem(STORAGE+"offerCountry",event.target.value);
  renderOffers();
});
document.getElementById("includeLoyalty").addEventListener("change",event=>{
  localStorage.setItem(STORAGE+"includeLoyalty",String(event.target.checked));
  renderOffers();
});
const loyaltySaved=localStorage.getItem(STORAGE+"includeLoyalty");
if(loyaltySaved!==null) document.getElementById("includeLoyalty").checked=loyaltySaved==="true";

document.getElementById("resetShopping").addEventListener("click",()=>{
  document.querySelectorAll(".checklist input").forEach(input=>{
    input.checked=false;
    localStorage.removeItem(STORAGE+"shop:"+input.dataset.itemId);
    updateCheckLabel(input);
  });
});
document.getElementById("refreshButton").addEventListener("click",async()=>{
  const button=document.getElementById("refreshButton");
  button.disabled=true;button.textContent="…";
  try{await loadData(true)}catch{alert(ui[currentLang].refreshError)}
  finally{button.disabled=false;button.textContent="↻"}
});
document.querySelectorAll(".tab").forEach(tab=>{
  tab.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.target).classList.add("active");
    window.scrollTo({top:document.querySelector(".tabs").offsetTop,behavior:"smooth"});
  });
});
const notes=document.getElementById("notes");
notes.value=localStorage.getItem(STORAGE+"notes")||localStorage.getItem("med-meal-plan-v2:notes")||"";
notes.addEventListener("input",()=>localStorage.setItem(STORAGE+"notes",notes.value));

const isIos=/iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone;
const hint=document.getElementById("installHint");
if(isIos&&!isStandalone&&localStorage.getItem(STORAGE+"hideInstall")!=="true") hint.classList.remove("hidden");
document.getElementById("closeInstallHint").addEventListener("click",()=>{
  hint.classList.add("hidden");localStorage.setItem(STORAGE+"hideInstall","true");
});
function formatDate(value){
  if(!value) return "";
  try{return new Intl.DateTimeFormat(currentLang==="de"?"de-DE":currentLang==="it"?"it-IT":"en-GB").format(new Date(value+"T12:00:00"))}
  catch{return value}
}
function formatMoney(value,currency="EUR"){
  if(value===null||value===undefined||Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat(currentLang==="de"?"de-DE":currentLang==="it"?"it-IT":"en-GB",{style:"currency",currency}).format(Number(value));
}
function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function escapeAttr(value){return escapeHtml(value)}
loadData().catch(()=>{document.getElementById("days").innerHTML="<p>Plan unavailable.</p>"});
if("serviceWorker"in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
