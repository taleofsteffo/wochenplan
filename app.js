
const STORAGE="med-meal-plan-v2:";
const LANGS=["de","en","it"];
let currentPlan=null;
let currentLang=chooseInitialLanguage();

const ui={
de:{eyebrow:"MEDITERRAN · HERZFREUNDLICH",language:"Sprache",installTitle:"Als App installieren",installText:"In Safari: Teilen → „Zum Home-Bildschirm“ → „Als Web-App öffnen“.",ok:"OK",plan:"Plan",shopping:"Einkauf",prep:"Meal-Prep",notes:"Notizen",shoppingSubtitle:"Häkchen bleiben auf diesem Gerät gespeichert.",reset:"Zurücksetzen",prepSubtitle:"Wenig tägliche Küchenzeit, mehr Leben.",notesSubtitle:"Vorlieben, Änderungen oder Gewichtsentwicklung.",notesPlaceholder:"Notizen werden lokal auf diesem Gerät gespeichert …",medicalPrefix:"Hinweis:",updated:"Aktualisiert",print:"Drucken / PDF",refreshError:"Kein neuer Plan erreichbar. Die gespeicherte Version bleibt verfügbar.",refreshAria:"Plan aktualisieren",sectionsAria:"Bereiche"},
en:{eyebrow:"MEDITERRANEAN · HEART-FRIENDLY",language:"Language",installTitle:"Install as an app",installText:"In Safari: Share → Add to Home Screen → Open as Web App.",ok:"OK",plan:"Plan",shopping:"Shopping",prep:"Meal Prep",notes:"Notes",shoppingSubtitle:"Your checkmarks stay saved on this device.",reset:"Reset",prepSubtitle:"Less daily kitchen time, more life.",notesSubtitle:"Preferences, changes or weight progress.",notesPlaceholder:"Notes are stored locally on this device …",medicalPrefix:"Note:",updated:"Updated",print:"Print / PDF",refreshError:"No new plan could be reached. The saved version remains available.",refreshAria:"Refresh plan",sectionsAria:"Sections"},
it:{eyebrow:"MEDITERRANEO · AMICO DEL CUORE",language:"Lingua",installTitle:"Installa come app",installText:"In Safari: Condividi → Aggiungi alla schermata Home → Apri come app web.",ok:"OK",plan:"Piano",shopping:"Spesa",prep:"Preparazione",notes:"Note",shoppingSubtitle:"Le spunte restano salvate su questo dispositivo.",reset:"Azzera",prepSubtitle:"Meno tempo ogni giorno in cucina, più vita.",notesSubtitle:"Preferenze, modifiche o andamento del peso.",notesPlaceholder:"Le note vengono salvate localmente su questo dispositivo …",medicalPrefix:"Nota:",updated:"Aggiornato",print:"Stampa / PDF",refreshError:"Non è stato possibile raggiungere un nuovo piano. La versione salvata resta disponibile.",refreshAria:"Aggiorna il piano",sectionsAria:"Sezioni"}
};

function chooseInitialLanguage(){
  const saved=localStorage.getItem(STORAGE+"language");
  if(LANGS.includes(saved)) return saved;
  const browser=(navigator.language||"en").slice(0,2).toLowerCase();
  return LANGS.includes(browser)?browser:"en";
}
function text(value){
  if(value&&typeof value==="object") return value[currentLang]??value.en??value.de??Object.values(value)[0]??"";
  return value??"";
}
async function loadPlan(forceNetwork=false){
  const url=forceNetwork?`plan.json?refresh=${Date.now()}`:"plan.json";
  const response=await fetch(url,{cache:forceNetwork?"no-store":"default"});
  if(!response.ok) throw new Error("plan-load-failed");
  currentPlan=await response.json();
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
}
function restoreChecklist(){
  document.querySelectorAll(".checklist input").forEach(input=>{
    const key=STORAGE+"shop:"+input.dataset.itemId;
    input.checked=localStorage.getItem(key)==="true";
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
  renderAll();
});
document.getElementById("resetShopping").addEventListener("click",()=>{
  document.querySelectorAll(".checklist input").forEach(input=>{
    input.checked=false;
    localStorage.removeItem(STORAGE+"shop:"+input.dataset.itemId);
    updateCheckLabel(input);
  });
});
document.getElementById("refreshButton").addEventListener("click",async()=>{
  const button=document.getElementById("refreshButton");
  button.disabled=true; button.textContent="…";
  try{await loadPlan(true)}catch{alert(ui[currentLang].refreshError)}
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
notes.value=localStorage.getItem(STORAGE+"notes")||"";
notes.addEventListener("input",()=>localStorage.setItem(STORAGE+"notes",notes.value));

const isIos=/iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone;
const hint=document.getElementById("installHint");
if(isIos&&!isStandalone&&localStorage.getItem(STORAGE+"hideInstall")!=="true") hint.classList.remove("hidden");
document.getElementById("closeInstallHint").addEventListener("click",()=>{
  hint.classList.add("hidden");localStorage.setItem(STORAGE+"hideInstall","true");
});
function formatDate(value){
  try{return new Intl.DateTimeFormat(currentLang==="de"?"de-DE":currentLang==="it"?"it-IT":"en-GB").format(new Date(value+"T12:00:00"))}
  catch{return value}
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function escapeAttr(value){return escapeHtml(value)}
loadPlan().catch(()=>{document.getElementById("days").innerHTML="<p>Plan unavailable.</p>"});
if("serviceWorker"in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
