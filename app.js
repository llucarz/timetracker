// =========================
//  Utilitaires temps
// =========================
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
  const day = (x.getUTCDay() + 6) % 7; // lundi = 0
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

// =========================
//  Constantes & stockage
// =========================
const STORE_KEY     = "tt_entries_v2";
const SETTINGS_KEY  = "tt_settings_v1";
const OT_STORE_KEY  = "tt_overtime_v1";

// ---- Chargement / sauvegarde entrées ----
function loadEntries() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return raw.map(e => ({
      status: "work",
      ...e,
      status: e.status || "work",
      id: e.id || crypto.randomUUID(),
    }));
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORE_KEY, JSON.stringify(entries));
}

// ---- Chargement / sauvegarde settings ----
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    if (typeof s.weeklyTarget !== "number") s.weeklyTarget = 35;
    if (typeof s.workDays    !== "number") s.workDays    = 5;
    s.cloudKey   ??= "";
    s.account    ??= null;        // { name, company, key }
    return s;
  } catch {
    return {
      weeklyTarget: 35,
      workDays: 5,
      cloudKey: "",
      account: null,
    };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ---- Chargement / sauvegarde heures sup ----
function loadOvertimeState() {
  try {
    const o = JSON.parse(localStorage.getItem(OT_STORE_KEY) || "{}");
    return {
      balanceMinutes: o.balanceMinutes || 0,
      earnedMinutes : o.earnedMinutes  || 0,
      usedMinutes   : o.usedMinutes    || 0,
      events: Array.isArray(o.events) ? o.events : [],
    };
  } catch {
    return { balanceMinutes: 0, earnedMinutes: 0, usedMinutes: 0, events: [] };
  }
}

function saveOvertimeState() {
  localStorage.setItem(OT_STORE_KEY, JSON.stringify(otState));
}

// =========================
//  État global en mémoire
// =========================
let entries  = loadEntries();
let settings = loadSettings();
let otState  = loadOvertimeState();
let editingId = null;

// Valeurs par défaut
settings.weeklyTarget ??= 35;
settings.workDays     ??= 5;

// =========================
//  DOM
// =========================
const $ = s => document.querySelector(s);

// Formulaire
const dateInput   = $("#date");
const startInput  = $("#start");
const lStartInput = $("#lunchStart");
const lEndInput   = $("#lunchEnd");
const endInput    = $("#end");
const notesInput  = $("#notes");
const statusInput = $("#status");

const btnToday     = $("#btnToday");
const btnSave      = $("#btnSave");
const btnClear     = $("#btnClear");
const btnDuplicate = $("#btnDuplicate");
const btnDelete    = $("#btnDelete");

// Stats rapides
const weeklyTargetInput = $("#weeklyTarget");
const workDaysInput     = $("#workDays");
const statDay   = $("#statDay");
const statWeek  = $("#statWeek");
const statMonth = $("#statMonth");
const statYear  = $("#statYear");
const weekProgress = $("#weekProgress");

// Tableau & récap global
const tbody      = $("#tbody");
const sumWeek    = $("#sumWeek");
const sumMonth   = $("#sumMonth");
const sumYear    = $("#sumYear");
const sumAll     = $("#sumAll");
const deltaWeek  = $("#deltaWeek");
const deltaMonth = $("#deltaMonth");
const deltaYear  = $("#deltaYear");
const entriesCount = $("#entriesCount");

const weekLabel  = $("#weekLabel");
const monthLabel = $("#monthLabel");
const yearLabel  = $("#yearLabel");

const prevPeriod  = $("#prevPeriod");
const nextPeriod  = $("#nextPeriod");
const weekPicker  = $("#weekPicker");
const monthPicker = $("#monthPicker");
const yearPicker  = $("#yearPicker");

// Export / import / cloud (ancienne clé)
const btnExportCSV = $("#btnExportCSV");
const fileImport   = $("#fileImport");
const btnCloudKey  = $("#btnCloudKey");
const btnCloudLoad = $("#btnCloudLoad");
const btnCloudSave = $("#btnCloudSave");

// Heures sup – affichage
const otBalanceHM   = $("#otBalanceHM");
const otBalanceDays = $("#otBalanceDays");
const otEarned      = $("#otEarned");
const otUsed        = $("#otUsed");

// Heures sup – formulaire de récup
const otDaysInput  = $("#otDays");
const otHoursInput = $("#otHours");
const otDateInput  = $("#otDate");
const otNoteInput  = $("#otNote");
const otApplyBtn   = $("#otApply");

// Heures sup – historique (modal)
const otShowHistoryBtn = $("#otShowHistory");
const otModal      = $("#otModal");
const otModalClose = $("#otModalClose");
const otHistoryBody  = $("#otHistoryBody");
const otHistoryEmpty = $("#otHistoryEmpty");

// Compte utilisateur (peut ne pas exister encore dans le HTML)
const accountBtn      = $("#accountBtn");
const accountModal    = $("#accountModal");
const accNameInput    = $("#accName");
const accCompanyInput = $("#accCompany");
const accSaveBtn      = $("#accSaveBtn");
const accCloseBtn     = $("#accCloseBtn");
const accLogoutBtn    = $("#accLogoutBtn");

// =========================
//  Filtre de période
// =========================
let currentFilter   = "week";
let periodAnchorKey = toDateKey(new Date());

// =========================
//  Cloud (ancienne clé)
// =========================
function updateCloudKeyLabel() {
  if (!btnCloudKey) return;
  btnCloudKey.textContent = settings.cloudKey
    ? `Cloud : clé (${settings.cloudKey})`
    : "Cloud : clé";
}

// =========================
//  Calcul temps travaillé
// =========================
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

  const first  = Math.max(0, b - a);
  const second = Math.max(0, d - c);
  return first + second;
}

function sumMinutes(filterFn) {
  return entries.filter(filterFn).reduce((acc, e) => acc + computeMinutes(e), 0);
}

// =========================
//  Init formulaire
// =========================
if (!dateInput.value) {
  dateInput.valueAsNumber =
    Date.now() - new Date().getTimezoneOffset() * 60000;
}
weeklyTargetInput.value = settings.weeklyTarget;
workDaysInput.value     = settings.workDays;

// Date de récup par défaut
if (otDateInput && !otDateInput.value) {
  otDateInput.valueAsNumber =
    Date.now() - new Date().getTimezoneOffset() * 60000;
}

// =========================
//  Init pickers période
// =========================
(function initPickers() {
  const d = new Date(periodAnchorKey + "T12:00:00Z");
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  if (monthPicker) monthPicker.value = `${y}-${m}`;
  if (yearPicker)  yearPicker.value  = String(y);
  if (weekPicker) {
    const onejan = new Date(Date.UTC(y, 0, 1));
    const week = Math.ceil(((d - onejan) / 86400000 + onejan.getUTCDay() + 1) / 7);
    weekPicker.value = `${y}-W${String(week).padStart(2, "0")}`;
  }
})();

// =========================
//  Events formulaire
// =========================
[startInput, lStartInput, lEndInput, endInput, dateInput, statusInput]
  .forEach(i => i && i.addEventListener("input", updateLiveStats));

btnToday?.addEventListener("click", () => {
  dateInput.valueAsNumber =
    Date.now() - new Date().getTimezoneOffset() * 60000;
  updateLiveStats();
});

btnDuplicate?.addEventListener("click", duplicateYesterday);

btnSave?.addEventListener("click", () => {
  const e = collectForm();
  if (!e.date) {
    alert("Choisis une date.");
    return;
  }
  if (!(e.start && e.end) && e.status === "work") {
    if (!confirm("Heures d'arrivée et de départ non complètes. Enregistrer quand même ?")) return;
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

btnDelete?.addEventListener("click", () => {
  if (!editingId) return;
  const idx = entries.findIndex(x => x.id === editingId);
  if (idx > -1) {
    entries.splice(idx, 1);
    saveEntries();
  }
  clearForm();
  render();
});

btnClear?.addEventListener("click", clearForm);

weeklyTargetInput?.addEventListener("change", () => {
  const v = parseFloat(weeklyTargetInput.value || "35");
  settings.weeklyTarget = isFinite(v) ? v : 35;
  saveSettings();
  render();
});

workDaysInput?.addEventListener("change", () => {
  const v = parseInt(workDaysInput.value || "5", 10);
  settings.workDays = isFinite(v) && v > 0 && v <= 7 ? v : 5;
  workDaysInput.value = settings.workDays;
  saveSettings();
  render();
});

// =========================
//  Export / import local
// =========================
btnExportCSV?.addEventListener("click", () =>
  download("timetracker.csv", toCSV(entries))
);

fileImport?.addEventListener("change", importFile);

// =========================
//  Cloud manuel (ancienne clé)
// =========================
btnCloudKey?.addEventListener("click", () => {
  const current = settings.cloudKey || "";
  const val = prompt("Clé de sauvegarde cloud (ex: prenom-35h) :", current);
  if (!val) return;
  settings.cloudKey = val.trim();
  saveSettings();
  updateCloudKeyLabel();
});

btnCloudSave?.addEventListener("click", async () => {
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

btnCloudLoad?.addEventListener("click", async () => {
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

// =========================
//  Gestion période
// =========================
function openPicker(el) {
  if (!el) return;
  if (el.showPicker) el.showPicker();
  else {
    el.style.display = "inline-block";
    el.focus();
    el.click();
  }
}

weekLabel?.addEventListener("click", () => {
  currentFilter = "week";
  render();
  openPicker(weekPicker);
});

monthLabel?.addEventListener("click", () => {
  currentFilter = "month";
  render();
  openPicker(monthPicker);
});

yearLabel?.addEventListener("click", () => {
  currentFilter = "year";
  render();
  if (yearPicker) {
    yearPicker.style.display = "inline-block";
    yearPicker.focus();
  }
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

weekPicker?.addEventListener("change", () => {
  if (!weekPicker.value) return;
  const d = isoWeekStart(weekPicker.value);
  periodAnchorKey = toDateKey(d);
  render();
});

monthPicker?.addEventListener("change", () => {
  if (!monthPicker.value) return;
  const [yy, mm] = monthPicker.value.split("-").map(Number);
  const d = new Date(Date.UTC(yy, mm - 1, 1));
  periodAnchorKey = toDateKey(d);
  render();
});

yearPicker?.addEventListener("change", () => {
  const y = parseInt(yearPicker.value, 10);
  if (!isFinite(y)) return;
  const d = new Date(Date.UTC(y, 0, 1));
  periodAnchorKey = toDateKey(d);
  render();
});

function shiftAnchor(delta) {
  const d = new Date(periodAnchorKey + "T12:00:00Z");
  if (currentFilter === "week") d.setUTCDate(d.getUTCDate() + 7 * delta);
  else if (currentFilter === "month") d.setUTCMonth(d.getUTCMonth() + delta);
  else d.setUTCFullYear(d.getUTCFullYear() + delta);
  periodAnchorKey = toDateKey(d);
  render();
}
prevPeriod?.addEventListener("click", () => shiftAnchor(-1));
nextPeriod?.addEventListener("click", () => shiftAnchor(+1));

// =========================
//  Helpers formulaire
// =========================
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
    notesInput.value = "";
  statusInput.value = "work";
  if (btnDelete) btnDelete.style.display = "none";
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
  startInput.value  = y.start || "";
  lStartInput.value = y.lunchStart || "";
  lEndInput.value   = y.lunchEnd || "";
  endInput.value    = y.end || "";
  notesInput.value  = y.notes || "";
  statusInput.value = y.status || "work";
  updateLiveStats();
}

function updateLiveStats() {
  const e = collectForm();
  const minutes = computeMinutes(e);
  statDay.textContent = minToHM(minutes);
  const today = e.date || toDateKey(new Date());
  const { start, end } = weekRangeOf(today);
  const weekMin  = sumMinutes(x => x.date >= start && x.date <= end);
  const monthMin = sumMinutes(x => x.date.slice(0, 7) === today.slice(0, 7));
  const yearMin  = sumMinutes(x => x.date.slice(0, 4) === today.slice(0, 4));
  statWeek.textContent  = minToHM(weekMin);
  statMonth.textContent = minToHM(monthMin);
  statYear.textContent  = minToHM(yearMin);
  updateWeekProgress(weekMin, start, end);
}

function updateWeekProgress(weekMin, wStart, wEnd) {
  const targetHours = parseFloat(weeklyTargetInput.value || "35") || 35;
  const workDays    = parseInt(workDaysInput.value || "5", 10) || 5;
  const dailyTarget = targetHours / workDays;

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
  weekProgress.style.width = p + "%";
}

// =========================
//  Heures sup gagnées
// =========================
function computeOvertimeEarned() {
  const targetHours = settings.weeklyTarget || 35;
  const workDays    = settings.workDays    || 5;
  const dailyTarget = targetHours / workDays;

  const map = new Map();
  for (const e of entries) {
    if (!e.date) continue;
    const { start } = weekRangeOf(e.date);
    const key = start;
    const obj = map.get(key) || { minutes: 0, absenceDays: 0 };
    obj.minutes += computeMinutes(e);
    if (
      e.status === "school" ||
      e.status === "vacation" ||
      e.status === "sick" ||
      e.status === "holiday"
    ) {
      obj.absenceDays += 1;
    }
    map.set(key, obj);
  }

  let totalDelta = 0;
  for (const [, v] of map) {
    const adjustedWeeklyHours = Math.max(
      0,
      targetHours - v.absenceDays * dailyTarget
    );
    const targetMin = adjustedWeeklyHours * 60;
    totalDelta += v.minutes - targetMin; // peut être négatif
  }
  return totalDelta;
}

// =========================
//  Rendu global
// =========================
function render() {
  const anchor = periodAnchorKey || toDateKey(new Date());
  const { start: wStart, end: wEnd } = weekRangeOf(anchor);

  // pastilles
  [weekLabel, monthLabel, yearLabel].forEach(el => el?.classList.remove("active"));
  (currentFilter === "week"
    ? weekLabel
    : currentFilter === "month"
    ? monthLabel
    : yearLabel
  )?.classList.add("active");

  if (weekPicker)
    weekPicker.style.display = currentFilter === "week" ? "inline-block" : "none";
  if (monthPicker)
    monthPicker.style.display = currentFilter === "month" ? "inline-block" : "none";
  if (yearPicker)
    yearPicker.style.display = currentFilter === "year" ? "inline-block" : "none";

  // labels
  weekLabel.textContent  = `Semaine ${wStart} → ${wEnd}`;
  monthLabel.textContent = `Mois ${anchor.slice(0, 7)}`;
  yearLabel.textContent  = `Année ${anchor.slice(0, 4)}`;

  const inRange = e =>
    currentFilter === "week"
      ? e.date >= wStart && e.date <= wEnd
      : currentFilter === "month"
      ? e.date.slice(0, 7) === anchor.slice(0, 7)
      : e.date.slice(0, 4) === anchor.slice(0, 4);

  // tableau
  tbody.innerHTML = "";
  for (const e of entries.filter(inRange)) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.date}</td>
      <td>${e.start || ""}</td>
      <td>${e.lunchStart || ""}</td>
      <td>${e.lunchEnd || ""}</td>
      <td>${e.end || ""}</td>
      <td>${minToHM(computeMinutes(e))}</td>
      <td>${statusLabel(e.status)}</td>
      <td>${escapeHtml(e.notes || "")}</td>
    `;
    tr.addEventListener("click", () => {
      editingId = e.id;
      dateInput.value   = e.date;
      startInput.value  = e.start || "";
      lStartInput.value = e.lunchStart || "";
      lEndInput.value   = e.lunchEnd || "";
      endInput.value    = e.end || "";
      notesInput.value  = e.notes || "";
      statusInput.value = e.status || "work";
      if (btnDelete) btnDelete.style.display = "inline-block";
      updateLiveStats();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    tbody.appendChild(tr);
  }

  const weekMin  = sumMinutes(x => x.date >= wStart && x.date <= wEnd);
  const monthMin = sumMinutes(x => x.date.slice(0, 7) === anchor.slice(0, 7));
  const yearMin  = sumMinutes(x => x.date.slice(0, 4) === anchor.slice(0, 4));
  const allMin   = sumMinutes(() => true);

  sumWeek.textContent  = minToHM(weekMin);
  sumMonth.textContent = minToHM(monthMin);
  sumYear.textContent  = minToHM(yearMin);
  sumAll.textContent   = minToHM(allMin);
  entriesCount.textContent = `${entries.length} saisie${entries.length > 1 ? "s" : ""}`;

  const targetHours = parseFloat(weeklyTargetInput.value || "35") || 35;
  const workDays    = parseInt(workDaysInput.value || "5", 10) || 5;
  const dailyTarget = targetHours / workDays;

  // Semaine
  const absenceDaysWeek = entries.filter(
    e =>
      e.date >= wStart &&
      e.date <= wEnd &&
      (e.status === "school" ||
       e.status === "vacation" ||
       e.status === "sick" ||
       e.status === "holiday")
  ).length;

  const adjustedWeeklyTarget = Math.max(
    0,
    targetHours - absenceDaysWeek * dailyTarget
  );
  const weekTargetMin = adjustedWeeklyTarget * 60;

  if (absenceDaysWeek >= workDays && weekMin === 0) {
    deltaWeek.textContent = "Absent toute la semaine";
    deltaWeek.className = "delta";
  } else if (weekTargetMin > 0 && weekMin > weekTargetMin) {
    const diff = weekMin - weekTargetMin;
    deltaWeek.textContent = `+${minToHM(diff)} vs cible`;
    deltaWeek.className = "delta plus";
  } else {
    deltaWeek.textContent = "—";
    deltaWeek.className = "delta";
  }

  // Mois
  const monthTargetMin = monthTargetMinutes(anchor, targetHours, workDays);
  if (monthTargetMin > 0 && monthMin > monthTargetMin) {
    const diff = monthMin - monthTargetMin;
    deltaMonth.textContent = `+${minToHM(diff)} vs cible`;
    deltaMonth.className = "delta plus";
  } else {
    deltaMonth.textContent = "—";
    deltaMonth.className = "delta";
  }

  // Année
  const yearTargetMin = yearTargetMinutes(anchor, targetHours, workDays);
  if (yearTargetMin > 0 && yearMin > yearTargetMin) {
    const diff = yearMin - yearTargetMin;
    deltaYear.textContent = `+${minToHM(diff)} vs cible`;
    deltaYear.className = "delta plus";
  } else {
    deltaYear.textContent = "—";
    deltaYear.className = "delta";
  }

  updateWeekProgress(weekMin, wStart, wEnd);

  // Heures sup (earned)
  const earned = computeOvertimeEarned();
  otState.earnedMinutes  = earned;
  otState.balanceMinutes = earned - (otState.usedMinutes || 0);
  saveOvertimeState();
  renderOvertime();
}

// =========================
//  Objectifs mois / année
// =========================
function monthTargetMinutes(anchorKey, weeklyTargetHours, workDays) {
  const dailyTarget = weeklyTargetHours / workDays;
  const y = +anchorKey.slice(0, 4);
  const m = +anchorKey.slice(5, 7) - 1;

  const monthFirst = new Date(Date.UTC(y, m, 1));
  const monthLast  = new Date(Date.UTC(y, m + 1, 0));

  let monday = mondayOf(monthFirst);
  let totalHours = 0;

  while (monday <= monthLast) {
    const weekStart = new Date(monday);
    const weekEnd   = new Date(monday);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    if (weekEnd < monthFirst || weekStart > monthLast) {
      monday.setUTCDate(monday.getUTCDate() + 7);
      continue;
    }

    const weekStartKey = toDateKey(weekStart);
    const weekEndKey   = toDateKey(weekEnd);

    let absenceDays = 0;
    for (const e of entries) {
      if (
        e.date >= weekStartKey &&
        e.date <= weekEndKey &&
        (e.status === "school" ||
         e.status === "vacation" ||
         e.status === "sick" ||
         e.status === "holiday")
      ) {
        absenceDays++;
      }
    }

    const adjustedWeekly = Math.max(
      0,
      weeklyTargetHours - absenceDays * dailyTarget
    );
    totalHours += adjustedWeekly;

    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return Math.round(totalHours * 60);
}

function yearTargetMinutes(anchorKey, weeklyTargetHours, workDays) {
  const dailyTarget = weeklyTargetHours / workDays;
  const y = +anchorKey.slice(0, 4);

  const yearFirst = new Date(Date.UTC(y, 0, 1));
  const yearLast  = new Date(Date.UTC(y, 11, 31));

  let monday = mondayOf(yearFirst);
  let totalHours = 0;

  while (monday <= yearLast) {
    const weekStart = new Date(monday);
    const weekEnd   = new Date(monday);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    if (weekEnd < yearFirst || weekStart > yearLast) {
      monday.setUTCDate(monday.getUTCDate() + 7);
      continue;
    }

    const weekStartKey = toDateKey(weekStart);
    const weekEndKey   = toDateKey(weekEnd);

    let absenceDays = 0;
    for (const e of entries) {
      if (
        e.date >= weekStartKey &&
        e.date <= weekEndKey &&
        (e.status === "school" ||
         e.status === "vacation" ||
         e.status === "sick" ||
         e.status === "holiday")
      ) {
        absenceDays++;
      }
    }

    const adjustedWeekly = Math.max(
      0,
      weeklyTargetHours - absenceDays * dailyTarget
    );
    totalHours += adjustedWeekly;

    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return Math.round(totalHours * 60);
}

// =========================
//  Heures sup : affichage & récup
// =========================
function renderOvertime() {
  const bal    = otState.balanceMinutes || 0;
  const earned = otState.earnedMinutes  || 0;
  const used   = otState.usedMinutes    || 0;

  otBalanceHM.textContent = minToHM(bal);
  otEarned.textContent    = minToHM(earned);
  otUsed.textContent      = minToHM(used);

  const targetHours = settings.weeklyTarget || 35;
  const workDays    = settings.workDays    || 5;
  const dailyTarget = targetHours / workDays;

  const hoursPerDay   = dailyTarget;
  const days          = hoursPerDay > 0 ? Math.trunc(bal / 60 / hoursPerDay) : 0;
  const remainingMin  = bal - days * hoursPerDay * 60;
  otBalanceDays.textContent = `${days} jour${days > 1 ? "s" : ""} · ${minToHM(
    remainingMin
  )}`;
}

// Enregistrer une récupération
otApplyBtn?.addEventListener("click", () => {
  const days  = parseInt(otDaysInput.value  || "0", 10) || 0;
  const hours = parseFloat(otHoursInput.value || "0")   || 0;
  const date  = otDateInput.value || toDateKey(new Date());
  const note  = (otNoteInput.value || "").trim();

  const targetHours = settings.weeklyTarget || 35;
  const workDays    = settings.workDays    || 5;
  const dailyTarget = targetHours / workDays;

  const totalHours = days * dailyTarget + hours;
  const minutes    = Math.round(totalHours * 60);

  if (minutes <= 0) {
    alert("Indique au moins quelques heures ou jours à récupérer.");
    return;
  }

  if (minutes > otState.balanceMinutes) {
    if (!confirm("Tu récupères plus que ton solde d'heures sup. Continuer quand même ?"))
      return;
  }

  otState.usedMinutes   += minutes;
  otState.balanceMinutes = otState.earnedMinutes - otState.usedMinutes;

  otState.events.push({
    id: crypto.randomUUID(),
    date,
    minutes,
    note,
  });

  saveOvertimeState();
  renderOvertime();
  refreshOtHistory();

  otDaysInput.value  = "0";
  otHoursInput.value = "0";
  otNoteInput.value  = "";
});

// =========================
//  Modale historique heures sup
// =========================
function openOtModal() {
  if (!otModal) return;
  otModal.classList.remove("hidden");
  refreshOtHistory();
}

function closeOtModal() {
  if (!otModal) return;
  otModal.classList.add("hidden");
}

otShowHistoryBtn?.addEventListener("click", openOtModal);
otModalClose?.addEventListener("click", closeOtModal);
otModal?.addEventListener("click", e => {
  if (e.target === otModal) closeOtModal();
});

function refreshOtHistory() {
  if (!otHistoryBody || !otHistoryEmpty) return;
  const events = otState.events || [];
  otHistoryBody.innerHTML = "";

  if (!events.length) {
    otHistoryEmpty.style.display = "block";
    return;
  }
  otHistoryEmpty.style.display = "none";

  for (const ev of events) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ev.date}</td>
      <td>${minToHM(ev.minutes)}</td>
      <td>${escapeHtml(ev.note || "")}</td>
      <td>
        <button class="icon-btn danger" data-id="${ev.id}" title="Supprimer">
          <span>🗑</span>
        </button>
      </td>
    `;
    tr.querySelector("button").addEventListener("click", () => {
      deleteOtEvent(ev.id);
    });
    otHistoryBody.appendChild(tr);
  }
}

function deleteOtEvent(id) {
  const idx = otState.events.findIndex(e => e.id === id);
  if (idx === -1) return;
  const ev = otState.events[idx];
  if (!confirm("Supprimer cette récupération ?")) return;

  otState.events.splice(idx, 1);
  otState.usedMinutes   = Math.max(0, otState.usedMinutes - ev.minutes);
  otState.balanceMinutes = otState.earnedMinutes - otState.usedMinutes;
  saveOvertimeState();
  renderOvertime();
  refreshOtHistory();
}

// =========================
//  Compte utilisateur (sans crash si HTML absent)
// =========================
function slugify(s) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function makeAccountKey(name, company) {
  const n = slugify(name);
  const c = slugify(company);
  if (!n || !c) return null;
  return `acct:${c}:${n}`;
}

function updateAccountUI() {
  if (!accountBtn) return;
  const acc = settings.account;
  const connected = acc && acc.key;

  if (connected) {
    accountBtn.textContent = `${acc.name} · ${acc.company}`;
    accountBtn.classList.add("account-connected");
    if (accLogoutBtn) accLogoutBtn.style.display = "inline-block";
    // on laisse les boutons cloud classiques pour l’instant
  } else {
    accountBtn.textContent = "Créer un compte";
    accountBtn.classList.remove("account-connected");
    if (accLogoutBtn) accLogoutBtn.style.display = "none";
  }
}

function openAccountModal() {
  if (!accountModal) return;
  const acc = settings.account;
  if (acc) {
    accNameInput.value    = acc.name || "";
    accCompanyInput.value = acc.company || "";
  } else {
    accNameInput.value    = "";
    accCompanyInput.value = "";
  }
  accountModal.classList.remove("hidden");
}

function closeAccountModal() {
  if (!accountModal) return;
  accountModal.classList.add("hidden");
}

async function handleAccountSave() {
  const name    = accNameInput.value.trim();
  const company = accCompanyInput.value.trim();
  const key = makeAccountKey(name, company);
  if (!key) {
    alert("Renseigne au moins un nom d’utilisateur et une société.");
    return;
  }
  settings.account = { name, company, key };
  settings.cloudKey = key; // réutilise la même clé côté backend
  saveSettings();
  updateAccountUI();
  closeAccountModal();
}

function handleLogout() {
  if (!confirm("Se déconnecter du compte ?")) return;
  settings.account = null;
  saveSettings();
  updateAccountUI();
  closeAccountModal();
}

if (accountBtn && accountModal) {
  accountBtn.addEventListener("click", openAccountModal);
  accCloseBtn?.addEventListener("click", closeAccountModal);
  accSaveBtn?.addEventListener("click", handleAccountSave);
  accLogoutBtn?.addEventListener("click", handleLogout);
}

// =========================
//  Divers
// =========================
function statusLabel(status) {
  switch (status) {
    case "school":  return "École / formation";
    case "vacation":return "Vacances";
    case "sick":    return "Arrêt maladie";
    case "holiday": return "Jour férié";
    default:        return "Travail";
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[m]);
}

function download(filename, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function toCSV(data) {
  const head = [
    "date",
    "start",
    "lunchStart",
    "lunchEnd",
    "end",
    "minutes",
    "status",
    "notes",
  ];
  const rows = data.map(e => [
    e.date,
    e.start || "",
    e.lunchStart || "",
    e.lunchEnd || "",
    e.end || "",
    computeMinutes(e),
    e.status || "work",
    (e.notes || "").replaceAll('"', '""'),
  ]);
  const csv = [
    head.join(","),
    ...rows.map(r => r.map(x => `"${x}"`).join(",")),
  ].join("\n");
  return csv;
}

async function importFile(ev) {
  const f = ev.target.files[0];
  if (!f) return;
  const text = await f.text();
  if (f.name.endsWith(".json")) {
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw 0;
      mergeEntries(arr);
    } catch {
      alert("JSON invalide.");
    }
  } else if (f.name.endsWith(".csv")) {
    const arr = parseCSV(text);
    mergeEntries(arr);
  } else {
    alert("Format non supporté.");
  }
  fileImport.value = "";
  render();
}

function mergeEntries(arr) {
  for (const r of arr) {
    if (!r.date) continue;
    const idx = entries.findIndex(x => x.date === r.date);
    const obj = {
      id: idx > -1 ? entries[idx].id : crypto.randomUUID(),
      date: r.date,
      start: r.start || "",
      lunchStart: r.lunchStart || "",
      lunchEnd: r.lunchEnd || "",
      end: r.end || "",
      notes: r.notes || "",
      status: r.status || "work",
    };
    if (idx > -1) entries[idx] = obj;
    else entries.push(obj);
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveEntries();
}

function parseCSV(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const head = lines
    .shift()
    .split(",")
    .map(s => s.replaceAll('"', "").trim());
  const idx = k => head.indexOf(k);
  const out = [];
  for (const line of lines) {
    const cols = line
      .match(/("(?:[^"]|"")*"|[^,]+)/g)
      .map(s => s.replace(/^"|"$/g, "").replaceAll('""', '"'));
    out.push({
      date: cols[idx("date")] || "",
      start: cols[idx("start")] || "",
      lunchStart: cols[idx("lunchStart")] || "",
      lunchEnd: cols[idx("lunchEnd")] || "",
      end: cols[idx("end")] || "",
      notes: cols[idx("notes")] || "",
      status: cols[idx("status")] || "work",
    });
  }
  return out;
}

// =========================
//  Premier rendu
// =========================
updateCloudKeyLabel();
render();
updateLiveStats();
renderOvertime();
updateAccountUI();
