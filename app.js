// Utilitaires temps
const pad = n => String(n).padStart(2, "0");

function hmToMin(hm) {
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function minToHM(min) {
  const sign = min < 0 ? "-" : "";
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${pad(m)}`;
}

function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

function mondayOf(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

function weekRangeOf(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  const m = mondayOf(d);
  const s = toDateKey(m);
  const e = new Date(m);
  e.setUTCDate(m.getUTCDate() + 6);
  return { start: s, end: toDateKey(e) };
}

// Stockage
const STORE_KEY = "tt_entries_v2"; // v2 pour le statut
const SETTINGS_KEY = "tt_settings_v1";

let entries = loadEntries();
let editingId = null;
const settings = loadSettings();

function loadEntries() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    // compat ancienne version : ajouter status=work si absent
    return raw.map(e => ({ status: "work", ...e, status: e.status || "work" }));
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORE_KEY, JSON.stringify(entries));
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// minutes effectives : 0 si journée non "Travail"
function computeMinutes(entry) {
  const status = entry.status || "work";
  if (status !== "work") return 0;

  const a = hmToMin(entry.start);
  const b = hmToMin(entry.lunchStart);
  const c = hmToMin(entry.lunchEnd);
  const d = hmToMin(entry.end);

  if (!entry.lunchStart || !entry.lunchEnd) {
    if (!entry.start || !entry.end) return 0;
    return Math.max(0, d - a);
  }
  if (!entry.start || !entry.end) return 0;

  const first = Math.max(0, b - a);
  const second = Math.max(0, d - c);
  return first + second;
}

function sumMinutes(filterFn) {
  return entries.filter(filterFn).reduce((acc, e) => acc + computeMinutes(e), 0);
}

// DOM
const $ = s => document.querySelector(s);
const dateInput = $("#date");
const startInput = $("#start");
const lStartInput = $("#lunchStart");
const lEndInput = $("#lunchEnd");
const endInput = $("#end");
const notesInput = $("#notes");
const statusInput = $("#status");

const btnToday = $("#btnToday");
const btnSave = $("#btnSave");
const btnClear = $("#btnClear");
const btnDuplicate = $("#btnDuplicate");
const btnDelete = $("#btnDelete");

const weeklyTargetInput = $("#weeklyTarget");
const statDay = $("#statDay");
const statWeek = $("#statWeek");
const statMonth = $("#statMonth");
const statYear = $("#statYear");
const weekProgress = $("#weekProgress");

const tbody = $("#tbody");
const sumWeek = $("#sumWeek");
const sumMonth = $("#sumMonth");
const sumYear = $("#sumYear");
const sumAll = $("#sumAll");
const deltaWeek = $("#deltaWeek");
const deltaMonth = $("#deltaMonth");
const deltaYear = $("#deltaYear");
const entriesCount = $("#entriesCount");

const weekLabel = $("#weekLabel");
const monthLabel = $("#monthLabel");
const yearLabel = $("#yearLabel");

const prevPeriod = $("#prevPeriod");
const nextPeriod = $("#nextPeriod");
const weekPicker = $("#weekPicker");
const monthPicker = $("#monthPicker");
const yearPicker = $("#yearPicker");

const btnExportCSV = $("#btnExportCSV");
const fileImport = $("#fileImport");

const btnCloudKey = $("#btnCloudKey");
const btnCloudLoad = $("#btnCloudLoad");
const btnCloudSave = $("#btnCloudSave");

// Filtre période
let currentFilter = "week";
let periodAnchorKey = toDateKey(new Date());

// Cloud
settings.cloudKey ??= "";
updateCloudKeyLabel();

// Init date et weeklyTarget
if (!dateInput.value) {
  dateInput.valueAsNumber =
    Date.now() - new Date().getTimezoneOffset() * 60000;
}
weeklyTargetInput.value = settings.weeklyTarget ?? 35;

// Init pickers
(function initPickers() {
  const d = new Date(periodAnchorKey + "T12:00:00Z");
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  if (monthPicker) monthPicker.value = `${y}-${m}`;
  if (yearPicker) yearPicker.value = String(y);
  if (weekPicker) {
    const onejan = new Date(Date.UTC(y, 0, 1));
    const week = Math.ceil(
      ((d - onejan) / 86400000 + onejan.getUTCDay() + 1) / 7
    );
    weekPicker.value = `${y}-W${String(week).padStart(2, "0")}`;
  }
})();

// Events formulaire
[startInput, lStartInput, lEndInput, endInput, dateInput, statusInput].forEach(
  i => i.addEventListener("input", updateLiveStats)
);

btnToday.addEventListener("click", () => {
  dateInput.valueAsNumber =
    Date.now() - new Date().getTimezoneOffset() * 60000;
  updateLiveStats();
});

btnDuplicate.addEventListener("click", duplicateYesterday);

btnSave.addEventListener("click", () => {
  const e = collectForm();
  if (!e.date) {
    alert("Choisis une date.");
    return;
  }
  if (!(e.start && e.end) && e.status === "work") {
    if (!confirm("Heures d'arrivée et de départ non complètes. Enregistrer quand même ?"))
      return;
  }
  if (editingId) {
    const idx = entries.findIndex(x => x.id === editingId);
    if (idx > -1) entries[idx] = { ...entries[idx], ...e };
  } else {
    const existingIdx = entries.findIndex(x => x.date === e.date);
    if (existingIdx > -1) entries.splice(existingIdx, 1);
    entries.push({ id: crypto.randomUUID(), ...e });
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveEntries();
  clearForm();
  render();
});

btnDelete.addEventListener("click", () => {
  if (!editingId) return;
  const idx = entries.findIndex(x => x.id === editingId);
  if (idx > -1) {
    entries.splice(idx, 1);
    saveEntries();
  }
  clearForm();
  render();
});

btnClear.addEventListener("click", clearForm);

weeklyTargetInput.addEventListener("change", () => {
  const v = parseFloat(weeklyTargetInput.value || "35");
  settings.weeklyTarget = isFinite(v) ? v : 35;
  saveSettings();
  render();
});

// Export / import
btnExportCSV.addEventListener("click", () =>
  download("timetracker.csv", toCSV(entries))
);
fileImport.addEventListener("change", importFile);

// Cloud
btnCloudKey.addEventListener("click", () => {
  const current = settings.cloudKey || "";
  const val = prompt(
    "Clé de sauvegarde cloud (ex: prenom-35h) :",
    current
  );
  if (!val) return;
  settings.cloudKey = val.trim();
  saveSettings();
  updateCloudKeyLabel();
});

btnCloudSave.addEventListener("click", async () => {
  if (!settings.cloudKey) {
    alert("Définis d'abord une clé cloud.");
    return;
  }
  try {
    const res = await fetch(`/api/data?key=${encodeURIComponent(settings.cloudKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    alert("Sauvegarde cloud OK ✅");
  } catch (e) {
    alert(`Sauvegarde cloud impossible : ${e.message || e}`);
  }
});

btnCloudLoad.addEventListener("click", async () => {
  if (!settings.cloudKey) {
    alert("Définis d'abord une clé cloud.");
    return;
  }
  if (!confirm("Remplacer les données locales par celles du cloud ?")) return;
  try {
    const res = await fetch(`/api/data?key=${encodeURIComponent(settings.cloudKey)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.entries)) {
      alert("Aucune donnée trouvée pour cette clé.");
      return;
    }
    entries = data.entries.map(e => ({
      status: "work",
      ...e,
      status: e.status || "work",
      id: e.id || crypto.randomUUID(),
    }));
    saveEntries();
    render();
    alert("Données cloud chargées ✅");
  } catch (e) {
    alert(`Chargement cloud impossible : ${e.message || e}`);
  }
});

function updateCloudKeyLabel() {
  btnCloudKey.textContent = settings.cloudKey
    ? `Cloud : clé (${settings.cloudKey})`
    : "Cloud : clé";
}

// Période
function openPicker(el) {
  if (!el) return;
  if (el.showPicker) el.showPicker();
  else {
    el.style.display = "inline-block";
    el.focus();
    el.click();
  }
}

weekLabel.addEventListener("click", () => {
  currentFilter = "week";
  render();
  openPicker(weekPicker);
});

monthLabel.addEventListener("click", () => {
  currentFilter = "month";
  render();
  openPicker(monthPicker);
});

yearLabel.addEventListener("click", () => {
  currentFilter = "year";
  render();
  yearPicker.style.display = "inline-block";
  yearPicker.focus();
});

function isoWeekStart(value) {
  const [y, wStr] = value.split("-W");
  const yNum = +y;
  const w = +wStr;
  const jan4 = new Date(Date.UTC(yNum, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Dow);
  const mondayTarget = new Date(mondayWeek1);
  mondayTarget.setUTCDate(mondayWeek1.getUTCDate() + (w - 1) * 7);
  return mondayTarget;
}

if (weekPicker) {
  weekPicker.addEventListener("change", () => {
    if (!weekPicker.value) return;
    const d = isoWeekStart(weekPicker.value);
    periodAnchorKey = toDateKey(d);
    render();
  });
}

if (monthPicker) {
  monthPicker.addEventListener("change", () => {
    if (!monthPicker.value) return;
    const [yy, mm] = monthPicker.value.split("-").map(Number);
    const d = new Date(Date.UTC(yy, mm - 1, 1));
    periodAnchorKey = toDateKey(d);
    render();
  });
}

if (yearPicker) {
  yearPicker.addEventListener("change", () => {
    const y = parseInt(yearPicker.value, 10);
    if (!isFinite(y)) return;
    const d = new Date(Date.UTC(y, 0, 1));
    periodAnchorKey = toDateKey(d);
    render();
  });
}

function shiftAnchor(delta) {
  const d = new Date(periodAnchorKey + "T12:00:00Z");
  if (currentFilter === "week") d.setUTCDate(d.getUTCDate() + 7 * delta);
  else if (currentFilter === "month") d.setUTCMonth(d.getUTCMonth() + delta);
  else d.setUTCFullYear(d.getUTCFullYear() + delta);
  periodAnchorKey = toDateKey(d);
  render();
}

prevPeriod.addEventListener("click", () => shiftAnchor(-1));
nextPeriod.addEventListener("click", () => shiftAnchor(+1));

// Form helpers
function collectForm() {
  return {
    date: dateInput.value || null,
    start: startInput.value || "",
    lunchStart: lStartInput.value || "",
    lunchEnd: lEndInput.value || "",
    end: endInput.value || "",
    notes: (notesInput.value || "").trim(),
    status: statusInput.value || "work",
  };
}

function clearForm() {
  editingId = null;
  startInput.value =
    lStartInput.value =
    lEndInput.value =
    endInput.value =
    notesInput.value =
      "";
  statusInput.value = "work";
  btnDelete.style.display = "none";
  updateLiveStats();
}

function duplicateYesterday() {
  const d = dateInput.value
    ? new Date(dateInput.value + "T12:00:00")
    : new Date();
  d.setDate(d.getDate() - 1);
  const key = toDateKey(d);
  const y = entries.find(e => e.date === key);
  if (!y) {
    alert("Aucune saisie la veille.");
    return;
  }
  startInput.value = y.start || "";
  lStartInput.value = y.lunchStart || "";
  lEndInput.value = y.lunchEnd || "";
  endInput.value = y.end || "";
  notesInput.value = y.notes || "";
  statusInput.value = y.status || "work";
  updateLiveStats();
}

function updateLiveStats() {
  const e = collectForm();
  const minutes = computeMinutes(e);
  statDay.textContent = minToHM(minutes);
  const today = e.date || toDateKey(new Date());
  const { start, end } = weekRangeOf(today);
  const weekMin = sumMinutes(x => x.date >= start && x.date <= end);
  const monthMin = sumMinutes(x => x.date.slice(0, 7) === today.slice(0, 7));
  const yearMin = sumMinutes(x => x.date.slice(0, 4) === today.slice(0, 4));
  statWeek.textContent = minToHM(weekMin);
  statMonth.textContent = minToHM(monthMin);
  statYear.textContent = minToHM(yearMin);
  updateWeekProgress(weekMin, start, end);
}

function updateWeekProgress(weekMin, wStart, wEnd) {
  const targetHours = parseFloat(weeklyTargetInput.value || "35") || 35;
  const dailyTarget = targetHours / 5;
  const absenceDays = entries.filter(
    e =>
      e.date >= wStart &&
      e.date <= wEnd &&
      (e.status === "school" ||
        e.status === "vacation" ||
        e.status === "sick" ||
        e.status === "holiday")
  ).length;
  const adjustedTarget = Math.max(0, targetHours - absenceDays * dailyTarget);
  const targetMin = adjustedTarget * 60;
  const p =
    targetMin > 0
      ? Math.max(0, Math.min(100, Math.round((weekMin * 100) / targetMin)))
      : 0;
  weekProgress.style.width = p + "%
