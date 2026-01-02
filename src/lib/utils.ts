/**
 * TimeTracker Utility Functions
 * 
 * Core business logic for time tracking calculations, overtime computation,
 * date handling, and time formatting.
 */

import { Entry, OvertimeEvent } from "./types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Pads a number with leading zeros to ensure 2 digits
 * @param n - Number to pad
 * @returns Padded string (e.g., 9 → "09")
 */
export const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Converts HH:MM time string to total minutes
 * @param hm - Time in "HH:MM" format
 * @returns Total minutes (e.g., "02:30" → 150)
 */
export function hmToMin(hm: string): number {
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Converts minutes to human-readable French format
 * @param min - Total minutes (can be negative)
 * @returns Formatted string (e.g., 150 → "2h30", -90 → "-1h30")
 */
export function minToHM(min: number): string {
  const sign = min < 0 ? "-" : "";
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${pad(m)}`;
}

/**
 * Formats duration in minutes to French-style duration string
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., 150 → "2h 30min", 60 → "1h", 30 → "30 min")
 */
export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? "- " : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs % 60);

  if (h === 0) return `${sign}${m} min`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${pad(m)}min`;
}

/**
 * Converts Date object to ISO date string (YYYY-MM-DD)
 * @param d - Date object
 * @returns ISO date string (e.g., "2025-01-15")
 */
export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Converts Date object to Local ISO date string (YYYY-MM-DD)
 * Uses local timezone instead of UTC
 * @param d - Date object
 * @returns Date string (e.g., "2025-01-15")
 */
export function toLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Finds the Monday of the week containing the given date
 * Uses UTC to avoid timezone issues in week calculations
 * @param d - Date object
 * @returns Date object set to Monday 00:00:00 UTC
 */
export function mondayOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (x.getUTCDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

/**
 * Gets the ISO week range (Monday to Sunday) for a given date
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Object with start (Monday) and end (Sunday) as ISO date strings
 */
export function weekRangeOf(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T12:00:00Z"); // Noon UTC to avoid timezone edge cases
  const m = mondayOf(d);
  const s = toDateKey(m);
  const e = new Date(m);
  e.setUTCDate(m.getUTCDate() + 6); // Add 6 days to get Sunday
  return { start: s, end: toDateKey(e) };
}

/**
 * Calculates total working minutes for a time entry
 * Returns 0 for non-work status types (school, vacation, sick, holiday)
 * Handles both with-lunch and without-lunch schedules
 * 
 * @param entry - Time entry with start/end times and optional lunch break
 * @returns Total working minutes excluding lunch break
 * 
 * @example
 * // With lunch: 9:00-12:30, 13:30-18:00 = 210 + 270 = 480 minutes (8h)
 * computeMinutes({ start: "09:00", lunchStart: "12:30", lunchEnd: "13:30", end: "18:00", status: "work" })
 * 
 * @example
 * // Without lunch: 9:00-17:00 = 480 minutes (8h)
 * computeMinutes({ start: "09:00", end: "17:00", status: "work" })
 */
export function computeMinutes(entry: Partial<Entry> | undefined | null): number {
  if (!entry) return 0;
  const status = entry.status || "work";
  // Non-work statuses don't count as working time
  if (status !== "work") return 0;

  const a = hmToMin(entry.start || "");      // Arrival
  const b = hmToMin(entry.lunchStart || ""); // Lunch start
  const c = hmToMin(entry.lunchEnd || "");   // Lunch end
  const d = hmToMin(entry.end || "");        // Departure

  // Case 1: No lunch break defined
  if (!entry.lunchStart || !entry.lunchEnd) {
    if (!entry.start || !entry.end) return 0;
    return Math.max(0, d - a); // Simple: end - start
  }

  // Case 2: With lunch break
  if (!entry.start || !entry.end) return 0;
  const first = Math.max(0, b - a);   // Morning: lunch_start - arrival
  const second = Math.max(0, d - c);  // Afternoon: departure - lunch_end
  return first + second;
}

/**
 * Calculates working minutes from a time schedule object
 * Similar to computeMinutes but works with plain time objects (not Entry)
 * Used for profile settings and recovery calculations
 * 
 * @param obj - Object with start, lunchStart, lunchEnd, end times
 * @returns Total working minutes
 */
export function computeMinutesFromTimes(obj: { start: string; lunchStart: string; lunchEnd: string; end: string }): number {
  if (!obj) return 0;
  const a = hmToMin(obj.start || "");
  const b = hmToMin(obj.lunchStart || "");
  const c = hmToMin(obj.lunchEnd || "");
  const d = hmToMin(obj.end || "");

  if (!obj.start || !obj.end) return 0;

  // No lunch break
  if (!obj.lunchStart || !obj.lunchEnd) {
    return Math.max(0, d - a);
  }

  // With lunch break
  // Validate chronological order: start <= lunchStart <= lunchEnd <= end
  if (b < a || c < b || d < c) {
    return 0;
  }

  const first = Math.max(0, b - a);
  const second = Math.max(0, d - c);
  return first + second;
}

/**
 * Checks if a work time slot overlaps with any recovery events
 * Used to prevent scheduling work during overtime recovery periods
 * 
 * @param date - ISO date string (YYYY-MM-DD)
 * @param start - Start time (HH:MM)
 * @param end - End time (HH:MM)
 * @param events - Array of overtime events with optional time slots
 * @returns Object with blocked status and optional reason message
 * 
 * @example
 * // Returns { blocked: true, reason: "Conflit avec récupération (09:00 - 12:00)" }
 * checkOverlap("2025-01-15", "09:00", "13:00", [{ date: "2025-01-15", start: "09:00", end: "12:00", ... }])
 */
export function checkOverlap(
  date: string,
  start: string,
  end: string,
  events: OvertimeEvent[]
): { blocked: boolean; reason?: string } {
  if (!start || !end) return { blocked: false };

  const workStart = hmToMin(start);
  const workEnd = hmToMin(end);

  // Filter recovery events for the same date that have time slots defined
  const dayEvents = events.filter(e => e.date === date && e.start && e.end);

  for (const event of dayEvents) {
    const eventStart = hmToMin(event.start!);
    const eventEnd = hmToMin(event.end!);

    // Overlap detection: (StartA < EndB) AND (EndA > StartB)
    // This catches all cases: partial overlap, complete overlap, one contains the other
    if (workStart < eventEnd && workEnd > eventStart) {
      return {
        blocked: true,
        reason: `Conflit avec récupération (${event.start} - ${event.end})`
      };
    }
  }

  return { blocked: false };
}

/**
 * Gets the recovery state for a specific date, identifying locked time slots
 * Used in entry forms to pre-fill and lock times during overtime recovery
 * 
 * Heuristic:
 * - Events starting before 12:00 lock morning (arrival + pause start)
 * - Events starting at/after 12:00 lock afternoon (pause end + departure)
 * 
 * @param date - ISO date string (YYYY-MM-DD)
 * @param events - Array of overtime events
 * @returns Object with locked/unlocked status and values for each time slot
 * 
 * @example
 * // Morning recovery event 09:00-12:00 locks arrival and pauseStart
 * getRecoveryState("2025-01-15", [{ date: "2025-01-15", start: "09:00", end: "12:00", ... }])
 * // Returns: { arrival: { value: "09:00", locked: true }, pauseStart: { value: "12:00", locked: true }, ... }
 */
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

    if (startH < 12) {
      // Morning recovery: locks arrival and pause start
      state.arrival = { value: event.start!, locked: true };
      state.pauseStart = { value: event.end!, locked: true };
    } else {
      // Afternoon recovery: locks pause end and departure
      state.pauseEnd = { value: event.start!, locked: true };
      state.departure = { value: event.end!, locked: true };
    }
  }

  return state;
}

/**
 * Sums up all recovery minutes for a specific date
 * Used in overtime calculation to credit recovered time back as "earned"
 * 
 * @param date - ISO date string (YYYY-MM-DD)
 * @param events - Array of overtime events
 * @returns Total recovery minutes for the date (positive values)
 */
export function getRecoveryMinutesForDay(date: string, events: OvertimeEvent[]): number {
  const dayEvents = events.filter(e => e.date === date);
  // Abs() is used because recovery events are stored as negative (consumption),
  // but for the "Daily Balance" calculation, they act as a credit (positive)
  // that offsets the "missed work" for that day.
  return dayEvents.reduce((acc, e) => acc + Math.abs(e.minutes || 0), 0);
}

/**
 * CORE BUSINESS LOGIC: Computes total overtime earned across all entries
 * 
 * This is the heart of the overtime calculation system. It processes all time entries
 * and recovery events to determine the cumulative overtime balance in minutes.
 * 
 * Algorithm:
 * 1. Groups entries by ISO week (Monday-Sunday) using weekRangeOf()
 * 2. For each week, calculates:
 *    - Total minutes worked (from time entries)
 *    - Recovery minutes (from overtime events)
 *    - Absence days (school, vacation, sick, holiday) that reduce target
 * 3. Compares actual vs target minutes per week:
 *    - CURRENT WEEK: Target = days_logged × daily_target - absence_days × daily_target
 *      (Only counts entered days, not full week)
 *    - PAST WEEKS: Target = weekly_target - absence_days × daily_target
 *      (Assumes full week was worked unless absent)
 * 4. Sums up deltas across all weeks: (actual - target)
 * 
 * @param entries - Array of all time entries
 * @param weeklyTarget - Target hours per week (e.g., 35)
 * @param workDays - Number of working days per week (e.g., 5)
 * @param events - Array of overtime events (for recovery credits)
 * @returns Total overtime balance in minutes (positive = surplus, negative = deficit)
 * 
 * @example
 * // Week 1: Worked 40h, target 35h → +5h
 * // Week 2: Worked 32h, target 35h → -3h
 * // Total: +2h (120 minutes)
 * computeOvertimeEarned(entries, 35, 5, [])
 */
export function computeOvertimeEarned(entries: Entry[], weeklyTarget: number, workDays: number, events: OvertimeEvent[] = []): number {
  const dailyTarget = weeklyTarget / workDays;

  // Group by ISO week: track minutes, absence days, and work dates
  const map = new Map<string, { minutes: number; absenceDays: number; workDates: Set<string> }>();

  for (const e of entries) {
    if (!e || !e.date) continue;
    const { start } = weekRangeOf(e.date); // Get Monday of this entry's week
    const key = start;

    let obj = map.get(key);
    if (!obj) {
      obj = {
        minutes: 0,
        absenceDays: 0,
        workDates: new Set(), // Tracks which dates have entries (work or absence)
      };
      map.set(key, obj);
    }

    // Add minutes worked for this entry
    const workMinutes = computeMinutes(e);

    // Add recovery minutes for this date (credits back time taken off)
    const recoveryMinutes = getRecoveryMinutesForDay(e.date, events);

    // Total credited minutes for this day
    obj.minutes += workMinutes + recoveryMinutes;

    // Count absence days that reduce the weekly target
    if (
      e.status === "school" ||
      e.status === "vacation" ||
      e.status === "sick" ||
      e.status === "holiday"
    ) {
      obj.absenceDays += 1;
      // Also track as "logged day" for current week calculation
      obj.workDates.add(e.date);
    }

    // Track work days (status=work or undefined) OR recovery days
    if (!e.status || e.status === "work" || e.status === "recovery") {
      obj.workDates.add(e.date);
    }
  }

  const todayKey = toDateKey(new Date());
  const { start: currentWeekStart } = weekRangeOf(todayKey);

  let totalDelta = 0;

  for (const [weekStartKey, v] of map) {
    // Unified Logic: "Pay as you go" / Daily Balance
    // Only count target hours for days that have actual entries (work or absence).
    // This ignores missing days in the past, preventing "Deficit of 35h" if user didn't log time.
    const daysLogged = v.workDates.size;
    const adjustedWeeklyHours = daysLogged * dailyTarget - (v.absenceDays * dailyTarget);

    const targetMin = adjustedWeeklyHours * 60;
    totalDelta += v.minutes - targetMin;
  }

  return totalDelta;
}

/**
 * Merges Tailwind CSS classes with proper deduplication
 * Uses clsx for conditional classes and twMerge to handle Tailwind conflicts
 * 
 * @param inputs - Class values (strings, objects, arrays)
 * @returns Merged class string
 * 
 * @example
 * cn("px-2 py-1", "px-4") // "py-1 px-4" (px-4 overrides px-2)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a string for use as a URL-safe identifier
 * - Converts to lowercase
 * - Removes accents (é→e, à→a, etc.)
 * - Removes non-alphanumeric characters except spaces
 * - Trims and replaces spaces with dashes
 * 
 * @param str - Input string
 * @returns Normalized string
 * 
 * @example
 * normalizeString("Société Générale") // "societe-generale"
 * normalizeString("John O'Doe") // "john-odoe"
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")                    // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "")    // Remove accent marks
    .replace(/[^a-z0-9\s]/g, "")        // Remove non-alphanumeric except spaces
    .trim()
    .replace(/\s+/g, "-");              // Replace spaces with single dash
}

/**
 * Generates a unique account key for cloud sync
 * Format: "acct:<normalized-company>:<normalized-name>"
 * 
 * Used as Redis key for storing user data in Upstash
 * 
 * @param company - Company name
 * @param name - User name
 * @returns Account key
 * 
 * @example
 * generateAccountKey("Acme Corp", "John Doe") // "acct:acme-corp:john-doe"
 */
export function generateAccountKey(company: string, name: string): string {
  const normCompany = normalizeString(company);
  const normName = normalizeString(name);
  return `acct:${normCompany}:${normName}`;
}

/**
 * Converts minutes into Days, Hours, Minutes object
 * Used for detailed overtime breakdown
 * @param minutes - Total minutes
 * @returns Object with days, hours, mins, and sign
 */
export function minutesToDHM(minutes: number) {
  const abs = Math.abs(minutes);
  const days = Math.floor(abs / (24 * 60));
  const hours = Math.floor((abs % (24 * 60)) / 60);
  const mins = abs % 60;
  return { days, hours, mins, sign: minutes < 0 ? -1 : 1 };
}

/**
 * Formats DHM object to string (e.g., "1j 2h 30m")
 * @param dhm - Object from minutesToDHM
 * @returns Formatted string
 */
export function formatDHM(dhm: { days: number; hours: number; mins: number; sign: number }) {
  const { days, hours, mins, sign } = dhm;
  const parts = [];
  if (days > 0) parts.push(`${days} ${days > 1 ? "jours" : "jour"}`);
  if (hours > 0) parts.push(`${hours} ${hours > 1 ? "heures" : "heure"}`);
  if (mins > 0) parts.push(`${mins} ${mins > 1 ? "minutes" : "minute"}`);

  if (parts.length === 0) return "0 minute"; // "0m" -> "0 minute"
  return (sign < 0 ? "- " : "") + parts.join(" ");
}

/**
 * Formats minutes into a Days equivalency string
 * Example: 14h -> "2 jours" (assuming 7h/day)
 * 
 * @param minutes - Total minutes
 * @param weeklyTarget - Target hours per week (e.g., 35)
 * @param workDays - Number of days per week (e.g., 5)
 * @returns Formatted string (e.g. "≈ 2.0 jours")
 */
export function formatMinutesToDays(minutes: number, weeklyTarget: number, workDays: number): string {
  if (workDays === 0) return "";

  const dailyTargetMinutes = (weeklyTarget * 60) / workDays;
  if (dailyTargetMinutes === 0) return "";

  const days = minutes / dailyTargetMinutes;
  const absDays = Math.abs(days);

  // Round to 1 decimal place (e.g. 2.1)
  const formattedDays = absDays.toFixed(1);

  const label = parseFloat(formattedDays) <= 1 ? "jour" : "jours";

  return `Soit ≈ ${formattedDays} ${label}`;
}
