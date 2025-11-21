import { Entry, OvertimeEvent } from "./types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const pad = (n: number) => String(n).padStart(2, "0");

export function hmToMin(hm: string): number {
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function minToHM(min: number): string {
  const sign = min < 0 ? "-" : "";
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${pad(m)}`;
}

export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? "- " : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs % 60);
  
  if (h === 0) return `${sign}${m} min`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${pad(m)}min`;
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function mondayOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (x.getUTCDay() + 6) % 7; // lundi = 0
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

export function weekRangeOf(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T12:00:00Z");
  const m = mondayOf(d);
  const s = toDateKey(m);
  const e = new Date(m);
  e.setUTCDate(m.getUTCDate() + 6);
  return { start: s, end: toDateKey(e) };
}

export function computeMinutes(entry: Partial<Entry> | undefined | null): number {
  if (!entry) return 0;
  const status = entry.status || "work";
  if (status !== "work") return 0;

  const a = hmToMin(entry.start || "");
  const b = hmToMin(entry.lunchStart || "");
  const c = hmToMin(entry.lunchEnd || "");
  const d = hmToMin(entry.end || "");

  if (!entry.lunchStart || !entry.lunchEnd) {
    if (!entry.start || !entry.end) return 0;
    return Math.max(0, d - a);
  }
  if (!entry.start || !entry.end) return 0;

  const first = Math.max(0, b - a);
  const second = Math.max(0, d - c);
  return first + second;
}

export function computeMinutesFromTimes(obj: { start: string; lunchStart: string; lunchEnd: string; end: string }): number {
  if (!obj) return 0;
  const a = hmToMin(obj.start || "");
  const b = hmToMin(obj.lunchStart || "");
  const c = hmToMin(obj.lunchEnd || "");
  const d = hmToMin(obj.end || "");

  if (!obj.start || !obj.end) return 0;

  if (!obj.lunchStart || !obj.lunchEnd) {
    return Math.max(0, d - a);
  }
  const first = Math.max(0, b - a);
  const second = Math.max(0, d - c);
  return first + second;
}

export function checkOverlap(
  date: string,
  start: string,
  end: string,
  events: OvertimeEvent[]
): { blocked: boolean; reason?: string } {
  if (!start || !end) return { blocked: false };

  const workStart = hmToMin(start);
  const workEnd = hmToMin(end);

  // Filter events for the same date that have start/end times
  const dayEvents = events.filter(e => e.date === date && e.start && e.end);

  for (const event of dayEvents) {
    const eventStart = hmToMin(event.start!);
    const eventEnd = hmToMin(event.end!);

    // Check overlap: (StartA < EndB) and (EndA > StartB)
    if (workStart < eventEnd && workEnd > eventStart) {
      return {
        blocked: true,
        reason: `Conflit avec récupération (${event.start} - ${event.end})`
      };
    }
  }

  return { blocked: false };
}

export function getRecoveryState(date: string, events: OvertimeEvent[]) {
  const state = {
    arrival: { value: "", locked: false },
    pauseStart: { value: "", locked: false },
    pauseEnd: { value: "", locked: false },
    departure: { value: "", locked: false },
  };

  const dayEvents = events.filter(e => e.date === date && e.start && e.end);

  for (const event of dayEvents) {
    const startH = parseInt(event.start!.split(":")[0], 10);
    
    // Heuristic: Starts before 12:00 -> Morning block
    if (startH < 12) {
      state.arrival = { value: event.start!, locked: true };
      state.pauseStart = { value: event.end!, locked: true };
    } 
    // Heuristic: Starts at or after 12:00 -> Afternoon block
    else {
      state.pauseEnd = { value: event.start!, locked: true };
      state.departure = { value: event.end!, locked: true };
    }
  }

  return state;
}

export function computeOvertimeEarned(entries: Entry[], weeklyTarget: number, workDays: number): number {
  const dailyTarget = weeklyTarget / workDays;

  // Regroupe par semaine : minutes, jours d'absence, et jours de travail réellement saisis
  const map = new Map<string, { minutes: number; absenceDays: number; workDates: Set<string> }>();
  
  for (const e of entries) {
    if (!e || !e.date) continue;
    const { start } = weekRangeOf(e.date); // lundi de la semaine
    const key = start;

    let obj = map.get(key);
    if (!obj) {
      obj = {
        minutes: 0,
        absenceDays: 0,
        workDates: new Set(), // dates de "vrai" travail saisi
      };
      map.set(key, obj);
    }

    // Minutes travaillées pour cette entrée
    obj.minutes += computeMinutes(e);

    // Jours d'absence qui réduisent la cible
    if (
      e.status === "school" ||
      e.status === "vacation" ||
      e.status === "sick" ||
      e.status === "holiday"
    ) {
      obj.absenceDays += 1;
    }

    // Jours de travail réellement saisis (on ignore les week-ends sans entrée)
    if (!e.status || e.status === "work") {
      obj.workDates.add(e.date);
    }
  }

  const todayKey = toDateKey(new Date());
  const { start: currentWeekStart } = weekRangeOf(todayKey);

  let totalDelta = 0;

  for (const [weekStartKey, v] of map) {
    const isCurrentWeek = (weekStartKey === currentWeekStart);

    let adjustedWeeklyHours;

    if (isCurrentWeek) {
      // ➜ Pour la semaine EN COURS :
      // on ne compte que les jours déjà saisis (travail) + les jours d'absence
      const workDaysLogged = v.workDates ? v.workDates.size : 0;
      const effectiveSlots = Math.min(workDaysLogged + v.absenceDays, workDays);
      adjustedWeeklyHours  = Math.max(0, effectiveSlots * dailyTarget);
    } else {
      // ➜ Pour les semaines PASSÉES :
      // logique classique : 35h - (absences * cible journalière)
      adjustedWeeklyHours = Math.max(
        0,
        weeklyTarget - v.absenceDays * dailyTarget
      );
    }

    const targetMin = adjustedWeeklyHours * 60;
    totalDelta += v.minutes - targetMin;
  }

  return totalDelta;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove non-alphanumeric except spaces
    .trim()
    .replace(/\s+/g, "-"); // Replace spaces with dashes
}

export function generateAccountKey(company: string, name: string): string {
  const normCompany = normalizeString(company);
  const normName = normalizeString(name);
  return `acct:${normCompany}:${normName}`;
}
