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
const STORE_KEY    = "tt_entries_v2";
const SETTINGS_KEY = "tt_settings_v1";
const OT_STORE_KEY = "tt_overtime_v1";

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
  scheduleCloudSync();
}

// ---- Chargement / sauvegarde settings ----
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    if (typeof s.weeklyTarget !== "number") s.weeklyTarget = 35;
    if (typeof s.workDays    !== "number") s.workDays    = 5;
    s.account  ??= null;   // { name, company, key }
    return s;
  } catch {
    return {
      weeklyTarget: 35,
      workDays: 5,
      account: null,
    };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  scheduleCloudSync();
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
  scheduleCloudSync();
}

// =========================
//  État global en mémoire
// =========================
let entries   = loadEntries();
let settings  = loadSettings();
let otState   = loadOvertimeState();
let editingId = null;

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
const entriesCountEl = $("#entriesCount");

const weekLabel  = $("#weekLabel");
const monthLabel = $("#monthLabel");
const yearLabel  = $("#yearLabel");

const prevPeriod  = $("#prevPeriod");
const nextPeriod  = $("#nextPeriod");
const weekPicker  = $("#weekPicker");
const monthPicker = $("#monthPicker");
const yearPicker  = $("#yearPicker");

// Export / import
const btnExportCSV = $("#btnExportCSV");
const fileImport   = $("#fileImport");

// Heures sup – affichage
const otBalanceHM   = $("#otBalanceHM");
const otBalanceDays = $("#otBalanceDays");
const otEarned      = $("#otEarned");
const otUsed        = $("#otUsed");

// Heures sup – formulaire récup
const otDaysInput  = $("#otDays");
const otHoursInput = $("#otHours");
const otDateInput  = $("#otDate");
const otNoteInput  = $("#otNote");
const otApplyBtn   = $("#otApply");

// Heures sup – modal historique
const otShowHistoryBtn = $("#otShowHistory");
const otModal      = $("#otModal");
const otModalClose = $("#otModalClose");
const otHistoryBody  = $("#otHistoryBody");
const otHistoryEmpty = $("#otHistoryEmpty");

// Compte utilisateur + menu
const accountBtn      = $("#accountBtn");
const accountModal    = $("#accountModal");
const accNameInput    = $("#accName");
const accCompanyInput = $("#accCompany");
const accSaveBtn      = $("#accSaveBtn");
const accCloseBtn     = $("#accCloseBtn");
const accLogoutBtn    = $("#accLogoutBtn");

// menu déroulant
const accountMenu         = $("#accountMenu");
const accMenuHeader       = $("#accMenuHeader");
const accMenuTotalHM      = $("#accMenuTotalHM");
const accMenuTotalEntries = $("#accMenuTotalEntries");
const accMenuLogin        = $("#accMenuLogin");
const accMenuEditProfile  = $("#accMenuEditProfile");
const accMenuExport       = $("#accMenuExport");
const accMenuImport       = $("#accMenuImport");
const accMenuLogout       = $("#accMenuLogout");

// =========================
//  Filtre de période
// =========================
let currentFilter   = "week";
let periodAnchorKey = toDateKey(new Date());

// =========================
//  Cloud auto (compte)
// =========================
let cloudSyncTimer = null;

function scheduleCloudSync() {
  if (!settings.account || !settings.account.key) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    cloudSyncTimer = null;
    syncToCloud().catch(console.error);
  }, 800);
}

async function syncToCloud() {
  if (!settings.account || !settings.account.key) return;
  const key = settings.account.key;

  const payload = {
    entries,
    settings: {
      weeklyTarget: settings.weeklyTarget,
      workDays: settings.workDays,
    },
    overtime: {
      balanceMinutes: otState.balanceMinutes,
      earnedMinutes : otState.earnedMinutes,
      usedMinutes   : otState.usedMinutes,
      events        : otState.events,
    },
  };

  await fetch(`/api/data?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function loadFromCloudForCurrentAccount() {
  if (!settings.account || !settings.account.key) return;
  try {
    const res = await fetch(
      `/api/data?key=${encodeURIComponent(settings.account.key)}`
    );
    if (!res.ok) {
      return;
    }
    const data = await res.json();

    // Entrées
    if (Array.isArray(data.entries)) {
      entries = data.entries.map(e => ({
        status: "work",
        ...e,
        status: e.status || "work",
        id: e.id || crypto.randomUUID(),
      }));
      saveEntries();
    }

    // Settings
    if (data.settings) {
      const s = data.settings;
      if (typeof s.weeklyTarget === "number") settings.weeklyTarget = s.weeklyTarget;
      if (typeof s.workDays    === "number") settings.workDays    = s.workDays;
      saveSettings();
    }

    // Heures sup
    if (data.overtime) {
      const o = data.overtime;
      otState = {
        balanceMinutes: o.balanceMinutes || 0,
        earnedMinutes : o.earnedMinutes  || 0,
        usedMinutes   : o.usedMinutes    || 0,
        events: Array.isArray(o.events) ? o.events : [],
      };
      saveOvertimeState();
    }

    weeklyTargetInput.value = settings.weeklyTarget;
    workDaysInput.value     = settings.workDays;

    render();
    updateLiveStats();
    renderOvertime();
    refreshOtHistory();
  } catch (err) {
    console.error("Erreur chargement cloud compte", err);
  }
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
if (dateInput && !dateInput.value) {
  dateInput.valueAsNumber =
    Date.now() - new Date().getTimezoneOffset() * 60000;
}
if (weeklyTargetInput) weeklyTargetInput.value = settings.weeklyTarget;
if (workDaysInput)     workDaysInput.value     = settings.workDays;

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
  if (!dateInput) return;
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
//  Export / import
// =========================
btnExportCSV?.addEventListener("click", () =>
  download("timetracker.csv", toCSV(entries))
);

fileImport?.addEventListener("change", importFile);

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
    totalDelta += v.minutes - targetMin;
  }
  return totalDelta;
}

// =========================
//  Rendu global
// =========================
function render() {
  const anchor = periodAnchorKey || toDateKey(new Date());
  const { start: wStart, end: wEnd } = weekRangeOf(anchor);

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

  weekLabel.textContent  = `Semaine ${wStart} → ${wEnd}`;
  monthLabel.textContent = `Mois ${anchor.slice(0, 7)}`;
  yearLabel.textContent  = `Année ${anchor.slice(0, 4)}`;

  const inRange = e =>
    currentFilter === "week"
      ? e.date >= wStart && e.date <= wEnd
      : currentFilter === "month"
      ? e.date.slice(0, 7) === anchor.slice(0, 7)
      : e.date.slice(0, 4) === anchor.slice(0, 4);

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
  const nEntries = entries.length;
  entriesCountEl.textContent = `${nEntries} saisie${nEntries > 1 ? "s" : ""}`;

  const targetHours = parseFloat(weeklyTargetInput.value || "35") || 35;
  const workDays    = parseInt(workDaysInput.value || "5", 10) || 5;
  const dailyTarget = targetHours / workDays;

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

  const monthTargetMin = monthTargetMinutes(anchor, targetHours, workDays);
  if (monthTargetMin > 0 && monthMin > monthTargetMin) {
    const diff = monthMin - monthTargetMin;
    deltaMonth.textContent = `+${minToHM(diff)} vs cible`;
    deltaMonth.className = "delta plus";
  } else {
    deltaMonth.textContent = "—";
    deltaMonth.className = "delta";
  }

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

  const earned = computeOvertimeEarned();
  otState.earnedMinutes  = earned;
  otState.balanceMinutes = earned - (otState.usedMinutes || 0);
  saveOvertimeState();
  renderOvertime();

  // 🔥 MAJ des stats dans le menu compte
  updateMenuStats(allMin, nEntries);
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
      (
        e.status === "school" ||
        e.status === "vacation" ||
        e.status === "sick" ||
        e.status === "holiday"
      )
    ) {
      absenceDays++;
    }
  }

  // Cible hebdomadaire ajustée
  const adjustedWeekly = Math.max(0, weeklyTargetHours - absenceDays * dailyTarget);
  totalHours += adjustedWeekly;

  monday.setUTCDate(monday.getUTCDate() + 7);
}

return totalHours * 60;
}

function yearTargetMinutes(anchorKey, weeklyTargetHours, workDays) {
  const year = +anchorKey.slice(0, 4);

  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));

  let monday = mondayOf(jan1);
  let totalHours = 0;
  const dailyTarget = weeklyTargetHours / workDays;

  while (monday <= dec31) {
    const weekStart = new Date(monday);
    const weekEnd = new Date(monday);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    const weekStartKey = toDateKey(weekStart);
    const weekEndKey = toDateKey(weekEnd);

    let absenceDays = 0;
    for (const e of entries) {
      if (
        e.date >= weekStartKey &&
        e.date <= weekEndKey &&
        (
          e.status === "school" ||
          e.status === "vacation" ||
          e.status === "sick" ||
          e.status === "holiday"
        )
      ) {
        absenceDays++;
      }
    }

    const adjustedWeekly = Math.max(0, weeklyTargetHours - absenceDays * dailyTarget);
    totalHours += adjustedWeekly;

    monday.setUTCDate(monday.getUTCDate() + 7);
  }

  return totalHours * 60;
}

// =========================
//  Rendue heures sup
// =========================
function renderOvertime() {
  otBalanceHM.textContent = minToHM(otState.balanceMinutes);
  otBalanceDays.textContent = (otState.balanceMinutes / (settings.workDays * 60)).toFixed(2) + " j";
  otEarned.textContent = minToHM(otState.earnedMinutes);
  otUsed.textContent = minToHM(otState.usedMinutes);
}

// =========================
//  Historique OT
// =========================
function refreshOtHistory() {
  otHistoryBody.innerHTML = "";
  if (!otState.events.length) {
    otHistoryEmpty.style.display = "block";
    return;
  }
  otHistoryEmpty.style.display = "none";

  for (const ev of otState.events) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ev.date}</td>
      <td>${ev.type === "use" ? "-" : "+"}${minToHM(ev.minutes)}</td>
      <td>${ev.note || ""}</td>
      <td>
        <button class="icon-btn danger" data-id="${ev.id}">
          <span>🗑️</span>
        </button>
      </td>
    `;
    otHistoryBody.appendChild(tr);
  }

  [...otHistoryBody.querySelectorAll(".icon-btn")].forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      otState.events = otState.events.filter(e => e.id !== id);
      otState.usedMinutes = otState.events
        .filter(e => e.type === "use")
        .reduce((a, b) => a + b.minutes, 0);
      otState.balanceMinutes = otState.earnedMinutes - otState.usedMinutes;
      saveOvertimeState();
      renderOvertime();
      refreshOtHistory();
    });
  });
}

otShowHistoryBtn?.addEventListener("click", () => {
  otModal.classList.remove("hidden");
  refreshOtHistory();
});
otModalClose?.addEventListener("click", () => otModal.classList.add("hidden"));

// =========================
//  Appliquer récup OT
// =========================
otApplyBtn?.addEventListener("click", () => {
  const d   = otDateInput.value;
  const h   = parseInt(otHoursInput.value || "0", 10);
  const day = parseFloat(otDaysInput.value || "0");

  const minutes = h * 60 + day * settings.workDays * 60;
  if (!minutes) {
    alert("Aucun montant de récupération indiqué.");
    return;
  }

  const ev = {
    id: crypto.randomUUID(),
    type: "use",
    minutes,
    date: d,
    note: otNoteInput.value || "",
  };

  otState.events.push(ev);
  otState.usedMinutes += minutes;
  otState.balanceMinutes = otState.earnedMinutes - otState.usedMinutes;

  saveOvertimeState();
  renderOvertime();
  refreshOtHistory();
});

// =========================
//  Statuts
// =========================
function statusLabel(s) {
  switch (s) {
    case "school": return "Cours";
    case "vacation": return "Congés";
    case "sick": return "Maladie";
    case "holiday": return "Férié";
    default: return "Travail";
  }
}

function escapeHtml(t) {
  return t.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// =========================
//  CSV
// =========================
function toCSV(arr) {
  const lines = ["date,start,lunchStart,lunchEnd,end,notes,status"];
  for (const e of arr) {
    lines.push([
      e.date,
      e.start || "",
      e.lunchStart || "",
      e.lunchEnd || "",
      e.end || "",
      (e.notes || "").replace(/"/g, '""'),
      e.status,
    ].map(v => `"${v}"`).join(","));
  }
  return lines.join("\n");
}

function download(name, content) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  a.download = name;
  a.click();
}

// =========================
//  Import
// =========================
function importFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const text = evt.target.result;
    const rows = text.split(/\r?\n/).slice(1);

    for (const row of rows) {
      if (!row.trim()) continue;
      const cols = row.match(/"([^"]*)"/g).map(s => s.slice(1, -1));
      const obj = {
        date: cols[0],
        start: cols[1],
        lunchStart: cols[2],
        lunchEnd: cols[3],
        end: cols[4],
        notes: cols[5],
        status: cols[6] || "work",
      };
      const idx = entries.findIndex(x => x.date === obj.date);
      if (idx >= 0) entries.splice(idx, 1);
      entries.push({ id: crypto.randomUUID(), ...obj });
    }
    entries.sort((a, b) => a.date.localeCompare(b.date));
    saveEntries();
    render();
  };
  reader.readAsText(file);
}

// =========================
//  MENU COMPTE
// =========================
accountBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  accountMenu.classList.toggle("hidden");
});

// Fermer si click ailleurs
document.addEventListener("click", () => {
  if (!accountMenu.classList.contains("hidden")) {
    accountMenu.classList.add("hidden");
  }
});

// -------------------------
// Menu items
// -------------------------

// Ouvrir modal compte (non connecté)
accMenuLogin?.addEventListener("click", () => {
  accountMenu.classList.add("hidden");
  openAccountModal();
});

// Modifier le profil
accMenuEditProfile?.addEventListener("click", () => {
  accountMenu.classList.add("hidden");
  openAccountModal();
});

// Export
accMenuExport?.addEventListener("click", () => {
  accountMenu.classList.add("hidden");
  download("timetracker.csv", toCSV(entries));
});

// Import
accMenuImport?.addEventListener("click", () => {
  accountMenu.classList.add("hidden");
  fileImport.click();
});

// Déconnexion
accMenuLogout?.addEventListener("click", () => {
  accountMenu.classList.add("hidden");
  handleLogout();
});

// =========================
// Mise à jour stats menu
// =========================
function updateMenuStats(totalMinutes, totalEntries) {
  accMenuTotalHM.textContent = minToHM(totalMinutes);
  accMenuTotalEntries.textContent = `${totalEntries} saisies`;
}

// =========================
//  Compte utilisateur
// =========================
function openAccountModal() {
  accNameInput.value = settings.account?.name || "";
  accCompanyInput.value = settings.account?.company || "";
  accountModal.classList.remove("hidden");
}

accCloseBtn?.addEventListener("click", () =>
  accountModal.classList.add("hidden")
);

accSaveBtn?.addEventListener("click", () => {
  const name = accNameInput.value.trim();
  const company = accCompanyInput.value.trim();
  if (!name) {
    alert("Entre un nom.");
    return;
  }

  // Première connexion → créer clé API
  if (!settings.account) {
    settings.account = {
      name,
      company,
      key: crypto.randomUUID(),
    };
  } else {
    settings.account.name = name;
    settings.account.company = company;
  }
  saveSettings();
  accountModal.classList.add("hidden");

  updateAccountUI();
  loadFromCloudForCurrentAccount();
});

accLogoutBtn?.addEventListener("click", handleLogout);

function handleLogout() {
  if (!confirm("Se déconnecter ?")) return;
  settings.account = null;
  saveSettings();
  updateAccountUI();
}

function updateAccountUI() {
  if (settings.account) {
    accountBtn.textContent = "Menu";
    accMenuHeader.textContent = `Connecté en tant que ${settings.account.name}`;
    accMenuLogin.style.display = "none";
    accMenuEditProfile.style.display = "block";
    accMenuLogout.style.display = "block";
    accMenuExport.style.display = "block";
    accMenuImport.style.display = "block";
  } else {
    accountBtn.textContent = "Menu";
    accMenuHeader.textContent = "Non connecté";
    accMenuLogin.style.display = "block";
    accMenuEditProfile.style.display = "none";
    accMenuLogout.style.display = "none";
    accMenuExport.style.display = "none";
    accMenuImport.style.display = "none";
  }
}

// =========================
//  Lancement
// =========================
updateAccountUI();
render();
updateLiveStats();
renderOvertime();
refreshOtHistory();
