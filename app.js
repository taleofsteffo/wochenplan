
const storagePrefix = "stefano-mealplan-v1:";
let currentPlan = null;

async function loadPlan(forceNetwork = false) {
  const url = forceNetwork ? `plan.json?refresh=${Date.now()}` : "plan.json";
  const response = await fetch(url, { cache: forceNetwork ? "no-store" : "default" });
  if (!response.ok) throw new Error("Plan konnte nicht geladen werden");
  currentPlan = await response.json();
  render(currentPlan);
}

function render(plan) {
  document.getElementById("appTitle").textContent = plan.appTitle;
  document.getElementById("weekLabel").textContent = plan.weekLabel;
  document.getElementById("updated").textContent = `Aktualisiert: ${formatDate(plan.updated)}`;

  const metrics = [
    [plan.target.calories, "Kalorien"],
    [plan.target.eggs, "Eier"],
    [plan.target.fish, "Fisch"],
    [plan.target.focus, "Schwerpunkt"]
  ];
  document.getElementById("summary").innerHTML = metrics.map(([value,label]) =>
    `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`
  ).join("");

  document.getElementById("days").innerHTML = plan.days.map(day => `
    <article class="day">
      <h2>${escapeHtml(day.day)} <span>${escapeHtml(day.calories)}</span></h2>
      ${day.meals.map(meal => `
        <div class="meal"><strong>${escapeHtml(meal.name)}</strong><p>${escapeHtml(meal.text)}</p></div>
      `).join("")}
    </article>
  `).join("");

  document.getElementById("prep").innerHTML = plan.mealPrep.map(block => `
    <article class="prep-card">
      <h3>${escapeHtml(block.title)}</h3>
      <ol>${block.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    </article>
  `).join("");

  let index = 0;
  document.getElementById("shopping").innerHTML = plan.shopping.map(group => `
    <section class="shop-group">
      <h3>${escapeHtml(group.category)}</h3>
      <ul class="checklist">
        ${group.items.map(item => {
          const id = `shop-${index++}`;
          return `<li><input id="${id}" data-item="${escapeAttr(item)}" type="checkbox">
            <label for="${id}">${escapeHtml(item)}</label></li>`;
        }).join("")}
      </ul>
    </section>
  `).join("");
  restoreChecklist();
}

function restoreChecklist() {
  document.querySelectorAll('.checklist input').forEach(input => {
    const key = storagePrefix + "shop:" + input.dataset.item;
    input.checked = localStorage.getItem(key) === "true";
    updateCheckLabel(input);
    input.addEventListener("change", () => {
      localStorage.setItem(key, input.checked);
      updateCheckLabel(input);
    });
  });
}
function updateCheckLabel(input) {
  document.querySelector(`label[for="${input.id}"]`)?.classList.toggle("done", input.checked);
}

document.getElementById("resetShopping").addEventListener("click", () => {
  document.querySelectorAll('.checklist input').forEach(input => {
    input.checked = false;
    localStorage.removeItem(storagePrefix + "shop:" + input.dataset.item);
    updateCheckLabel(input);
  });
});

document.getElementById("refreshButton").addEventListener("click", async () => {
  const button = document.getElementById("refreshButton");
  button.disabled = true;
  button.textContent = "…";
  try { await loadPlan(true); }
  catch (error) { alert("Kein neuer Plan erreichbar. Die gespeicherte Version bleibt verfügbar."); }
  finally { button.disabled = false; button.textContent = "↻"; }
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.target).classList.add("active");
    window.scrollTo({top: document.querySelector(".tabs").offsetTop, behavior:"smooth"});
  });
});

const notes = document.getElementById("notes");
notes.value = localStorage.getItem(storagePrefix + "notes") || "";
notes.addEventListener("input", () => localStorage.setItem(storagePrefix + "notes", notes.value));

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
const hint = document.getElementById("installHint");
if (isIos && !isStandalone && localStorage.getItem(storagePrefix + "hideInstall") !== "true") {
  hint.classList.remove("hidden");
}
document.getElementById("closeInstallHint").addEventListener("click", () => {
  hint.classList.add("hidden");
  localStorage.setItem(storagePrefix + "hideInstall", "true");
});

function formatDate(value) {
  try { return new Intl.DateTimeFormat("de-DE").format(new Date(value + "T12:00:00")); }
  catch { return value; }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
function escapeAttr(value) { return escapeHtml(value); }

loadPlan().catch(() => {
  document.getElementById("days").innerHTML = "<p>Der Plan konnte nicht geladen werden.</p>";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
