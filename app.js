// ========= Utilitaires temps =========
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

// ========= Stockage =========
const STORE_KEY = "tt_entries_v2";  // version avec statut
const SETTINGS_KEY = "tt_settings_v2";

let entries = loadEntries();
let editingId = null;
const settings = loadSettings();

function loadEntries() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return raw.map(e => ({
      status: "work",
      ...e,
      status: e.status || "work",
      id: e.id || crypto.randomUUID()
    }));
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

// valeurs par défaut
settings.weeklyTarget ??= 35;        // heures / semaine
settings.workingDays ??= 5;          // jours travaillés / semaine
settings.cloudKey ??= "";
settings.overtimeUsedMin ??= 0;      // minutes déjà récupérées via le portefeuille

// ========= Minutes de travail =========
function computeMinutes(entry) {
  const status = entry.status || "work";
  if (status !== "work") return 0; // école, vacances, maladie, férié => 0h

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

// ========= DOM =========
const $  = s => document.querySelector(s);
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

const weeklyTargetInput = $("#weeklyTarget");
const workingDaysInput  = $("#workingDays");

const statDay   = $("#statDay");
const statWeek  = $("#statWeek");
const statMonth = $("#statMonth");
const statYear  = $("#statYear");
const weekProgress = $("#weekProgress");

const tbody       = $("#tbody");
const sumWeek     = $("#sumWeek");
const sumMonth    = $("#sumMonth");
const sumYear     = $("#sumYear");
const sumAll      = $("#sumAll");
const deltaWeek   = $("#deltaWeek");
const deltaMonth  = $("#deltaMonth");
const deltaYear   = $("#deltaYear");
const entriesCount = $("#entriesCount");

const weekLabel  = $("#weekLabel");
const monthLabel = $("#monthLabel");
const yearLabel  = $("#yearLabel");

const prevPeriod  = $("#prevPeriod");
const nextPeriod  = $("#nextPeriod");
const weekPicker  = $("#weekPicker");
const monthPicker = $("#monthPicker");
const yearPicker  = $("#yearPicker");

const btnExportCSV = $("#btnExportCSV");
const fileImport   = $("#fileImport");

const btnCloudKey  = $("#btnCloudKey");
const btnCloudLoad = $("#btnCloudLoad");
const btnCloudSave = $("#btnCloudSave");

// DOM portefeuille d’heures sup
const otBalanceHM   = $("#otBalanceHM");
const otBalanceDays = $("#otBalanceDays");
const otEarned      = $("#otEarned");
const otUsed        = $("#otUsed");
const otDaysInput   = $("#otDays");
const otHoursInput  = $("#otHours");
const otApply       = $("#otApply");

// ========= Filtre période =========
let currentFilter   = "week";
let periodAnchorKey = toDateKey(new Date());

// ========= Init champs =========
if (!dateInput.value) {
  dateInput.valueAsNumber =
    Date.now() - new Date().getTimezoneOffset() * 60000;
}

weeklyTargetInput.value = settings.weeklyTarget;
workingDaysInput.value  = settings.workingDays;

// Pickers init
(function initPickers() {
  const d = new Date(periodAnchorKey + "T12:00:00Z");
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");

  if (monthPicker) monthPicker.value = `${y}-${m}`;
  if (yearPicker) yearPicker.value  = String(y);

  if (weekPicker) {
    const onejan = new Date(Date.UTC(y, 0, 1));
    const week = Math.ceil(
      ((d - onejan) / 86400000 + onejan.getUTCDay() + 1) / 7
    );
    weekPicker.value = `${y}-W${String(week).padStart(2, "0")}`;
  }
})();

// ========= Events formulaire =========
[
  startInput,
  lStartInput,
  lEndInput,
  endInput,
  dateInput,
  statusInput
].forEach(i => i.addEventListener("input", updateLiveStats));

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
    if (
      !confirm(
        "Heures d'arrivée et de départ non complètes. Enregistrer quand même ?"
      )
    )
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
  settings.weeklyTarget = isFinite(v) && v > 0 ? v : 35;
  weeklyTargetInput.value = settings.weeklyTarget;
  saveSettings();
  render();
  updateLiveStats();
});

workingDaysInput.addEventListener("change", () => {
  let v = parseInt(workingDaysInput.value || "5", 10);
  if (!isFinite(v) || v < 1) v = 1;
  if (v > 7) v = 7;
  settings.workingDays = v;
  workingDaysInput.value = v;
  saveSettings();
  render();
  updateLiveStats();
});

// ========= Export / import =========
btnExportCSV.addEventListener("click", () =>
  download("timetracker.csv", toCSV(entries))
);
fileImport.addEventListener("change", importFile);

// ========= Cloud =========
btnCloudKey.addEventListener("click", () => {
  const current = settings.cloudKey || "";
  const val = prompt("Clé de sauvegarde cloud (ex: prenom-35h) :", current);
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
    const res = await fetch(
      `/api/data?key=${encodeURIComponent(settings.cloudKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries })
      }
    );
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
    const res = await fetch(
      `/api/data?key=${encodeURIComponent(settings.cloudKey)}`
    );
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
      id: e.id || crypto.randomUUID()
    }));
    saveEntries();
    render();
    alert("Données cloud chargées ✅");
  } catch (e) {
    alert(`Chargement cloud impossible : ${e.message || e}`);
  }
});

function updateCloudKeyLabel() {
  if (!btnCloudKey) return;
  btnCloudKey.textContent = settings.cloudKey
    ? `Cloud : clé (${settings.cloudKey})`
    : "Cloud : clé";
}

// ========= Période / pickers =========
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

// ========= Helpers formulaire =========
function collectForm() {
  return {
    date: dateInput.value || null,
    start: startInput.value || "",
    lunchStart: lStartInput.value || "",
    lunchEnd: lEndInput.value || "",
    end: endInput.value || "",
    notes: (notesInput.value || "").trim(),
    status: statusInput.value || "work"
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

// ========= Live stats (zone gauche) =========
function dailyTargetMinutes() {
  const weekly = parseFloat(weeklyTargetInput.value || "35") || 35;
  const wd =
    parseInt(workingDaysInput.value || `${settings.workingDays || 5}`, 10) ||
    5;
  return (weekly * 60) / Math.max(1, wd);
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
  recomputeOvertime(); // pour voir l’impact direct sur le portefeuille
}

function updateWeekProgress(weekMin, wStart, wEnd) {
  const targetHours = parseFloat(weeklyTargetInput.value || "35") || 35;
  const workingDays =
    parseInt(workingDaysInput.value || `${settings.workingDays || 5}`, 10) ||
    5;
  const dailyTarget = targetHours / Math.max(1, workingDays);

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

// ========= Rendu principal =========
function render() {
  const anchor = periodAnchorKey || toDateKey(new Date());
  const { start: wStart, end: wEnd } = weekRangeOf(anchor);

  // pastilles
  [weekLabel, monthLabel, yearLabel].forEach(el =>
    el.classList.remove("active")
  );
  (currentFilter === "week"
    ? weekLabel
    : currentFilter === "month"
    ? monthLabel
    : yearLabel
  ).classList.add("active");

  if (weekPicker)
    weekPicker.style.display =
      currentFilter === "week" ? "inline-block" : "none";
  if (monthPicker)
    monthPicker.style.display =
      currentFilter === "month" ? "inline-block" : "none";
  if (yearPicker)
    yearPicker.style.display =
      currentFilter === "year" ? "inline-block" : "none";

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
      dateInput.value = e.date;
      startInput.value = e.start || "";
      lStartInput.value = e.lunchStart || "";
      lEndInput.value = e.lunchEnd || "";
      endInput.value = e.end || "";
      notesInput.value = e.notes || "";
      statusInput.value = e.status || "work";
      btnDelete.style.display = "inline-block";
      updateLiveStats();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    tbody.appendChild(tr);
  }

  // agrégats
  const weekMin  = sumMinutes(x => x.date >= wStart && x.date <= wEnd);
  const monthMin = sumMinutes(x => x.date.slice(0, 7) === anchor.slice(0, 7));
  const yearMin  = sumMinutes(x => x.date.slice(0, 4) === anchor.slice(0, 4));
  const allMin   = sumMinutes(() => true);

  sumWeek.textContent  = minToHM(weekMin);
  sumMonth.textContent = minToHM(monthMin);
  sumYear.textContent  = minToHM(yearMin);
  sumAll.textContent   = minToHM(allMin);
  entriesCount.textContent = `${entries.length} saisie${
    entries.length > 1 ? "s" : ""
  }`;

  // objectifs / deltas
  const targetHours = parseFloat(weeklyTargetInput.value || "35") || 35;
  const workingDays =
    parseInt(workingDaysInput.value || `${settings.workingDays || 5}`, 10) ||
    5;
  const dailyTarget = targetHours / Math.max(1, workingDays);

  // semaine
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

  if (absenceDaysWeek >= workingDays && weekMin === 0) {
    deltaWeek.textContent = "Absent toute la semaine";
    deltaWeek.className = "delta";
  } else if (weekMin > weekTargetMin && weekTargetMin > 0) {
    const weekDelta = weekMin - weekTargetMin;
    deltaWeek.textContent = `+${minToHM(weekDelta)} vs cible`;
    deltaWeek.className = "delta plus";
  } else {
    deltaWeek.textContent = "—";
    deltaWeek.className = "delta";
  }

  // mois / année : cibles ajustées avec absences
  const monthTargetMin = monthTargetMinutes(anchor, targetHours, workingDays);
  if (monthMin > monthTargetMin && monthTargetMin > 0) {
    const monthDelta = monthMin - monthTargetMin;
    deltaMonth.textContent = `+${minToHM(monthDelta)} vs cible`;
    deltaMonth.className = "delta plus";
  } else {
    deltaMonth.textContent = "—";
    deltaMonth.className = "delta";
  }

  const yearTargetMin = yearTargetMinutes(anchor, targetHours, workingDays);
  if (yearMin > yearTargetMin && yearTargetMin > 0) {
    const yearDelta = yearMin - yearTargetMin;
    deltaYear.textContent = `+${minToHM(yearDelta)} vs cible`;
    deltaYear.className = "delta plus";
  } else {
    deltaYear.textContent = "—";
    deltaYear.className = "delta";
  }

  updateWeekProgress(weekMin, wStart, wEnd);
  recomputeOvertime();
}

// ========= Objectifs mensuels / annuels ajustés =========
function monthTargetMinutes(anchorKey, weeklyTargetHours, workingDays) {
  const dailyTarget = weeklyTargetHours / Math.max(1, workingDays);
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

function yearTargetMinutes(anchorKey, weeklyTargetHours, workingDays) {
  const dailyTarget = weeklyTargetHours / Math.max(1, workingDays);
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

// ========= Portefeuille d’heures sup =========
// On calcule pour chaque jour :
// diff = minutesTravaillées - objectifJour (0 pour absences)
// Solde brut = somme de toutes les diff (peut être négatif)
// Solde net = solde brut - minutes déjà récupérées (settings.overtimeUsedMin)

function recomputeOvertime() {
  if (!otBalanceHM) return; // section absente

  const dayTargetMin = dailyTargetMinutes();
  let earnedMin = 0;

  for (const e of entries) {
    const status = e.status || "work";
    if (status !== "work") continue; // absences => pas d'obligation

    const worked = computeMinutes(e);
    earnedMin += worked - dayTargetMin;
  }

  const usedMin = settings.overtimeUsedMin || 0;
  const balanceMin = earnedMin - usedMin;

  otEarned.textContent    = minToHM(earnedMin);
  otUsed.textContent      = minToHM(usedMin);
  otBalanceHM.textContent = minToHM(balanceMin);

  const sign = balanceMin < 0 ? "-" : "";
  const abs  = Math.abs(balanceMin);
  const dm   = dayTargetMin || 60 * 7;

  const days = Math.floor(abs / dm);
  const rest = abs - days * dm;
  const h    = Math.floor(rest / 60);
  const m    = rest % 60;

  const labelDays = `${days} jour${days > 1 ? "s" : ""} · ${h}h${pad(m)}`;
  otBalanceDays.textContent = sign ? `${sign}${labelDays}` : labelDays;
}

// user clique sur "Enregistrer la récup"
if (otApply) {
  otApply.addEventListener("click", () => {
    const d = parseFloat(otDaysInput.value || "0") || 0;
    const h = parseFloat(otHoursInput.value || "0") || 0;

    const extraMin = d * dailyTargetMinutes() + h * 60;
    if (extraMin <= 0) return;

    settings.overtimeUsedMin =
      (settings.overtimeUsedMin || 0) + Math.round(extraMin);

    otDaysInput.value  = "0";
    otHoursInput.value = "0";

    saveSettings();
    recomputeOvertime();
  });
}

// ========= Divers =========
function statusLabel(status) {
  switch (status) {
    case "school":
      return "École / formation";
    case "vacation":
      return "Vacances";
    case "sick":
      return "Arrêt maladie";
    case "holiday":
      return "Jour férié";
    default:
      return "Travail";
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m])
  );
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
    "notes"
  ];
  const rows = data.map(e => [
    e.date,
    e.start || "",
    e.lunchStart || "",
    e.lunchEnd || "",
    e.end || "",
    computeMinutes(e),
    e.status || "work",
    (e.notes || "").replaceAll('"', '""')
  ]);
  const csv = [
    head.join(","),
    ...rows.map(r => r.map(x => `"${x}"`).join(","))
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
      status: r.status || "work"
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
      status: cols[idx("status")] || "work"
    });
  }
  return out;
}

// ========= Premier rendu =========
updateCloudKeyLabel();
render();
updateLiveStats();
recomputeOvertime();
