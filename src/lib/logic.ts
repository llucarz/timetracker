/**
 * TimeTracker Business Logic - Single Source of Truth
 * 
 * Centralized functions for daily target and overtime calculations.
 * All UI components should use these functions instead of calculating targets locally.
 */

import { Entry, OvertimeEvent, Settings } from "./types";
import { computeMinutes, getRecoveryMinutesForDay, hmToMin } from "./utils";

/**
 * Day key mapping for Settings.baseHours.days
 */
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Gets planned work minutes for a specific weekday from user's schedule configuration.
 * 
 * This is the foundation for schedule-based daily targets. It extracts the configured
 * work hours for a given day of the week from the user's profile settings.
 * 
 * @param weekday - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param settings - User settings containing schedule configuration
 * @returns Planned work minutes for that weekday, 0 if the day is explicitly not
 *          worked, or null if nothing is configured (caller falls back to the average)
 * 
 * @example
 * // User has per-day schedule: Mon-Thu = 8h, Fri = 7h
 * getPlannedWorkMinutesForWeekday(1, settings) // Monday → 480 minutes (8h)
 * getPlannedWorkMinutesForWeekday(5, settings) // Friday → 420 minutes (7h)
 * 
 * @example
 * // User has same schedule for all days: 7h30
 * getPlannedWorkMinutesForWeekday(1, settings) // → 450 minutes (7h30)
 */
export function getPlannedWorkMinutesForWeekday(
  weekday: number,
  settings: Settings
): number | null {
  if (!settings.baseHours) {
    return null;
  }

  const dayKey = DAY_KEYS[weekday];

  // Mode 1: Per-day schedule (different hours each day)
  if (settings.baseHours.mode === "per-day" && settings.baseHours.days) {
    const daySchedule = settings.baseHours.days[dayKey];

    if (!daySchedule) {
      return null; // Nothing configured for that weekday
    }

    // Explicitly not a working day: the target is ZERO, not "unknown".
    // Returning null here made the caller fall back to the weekly average, so a
    // Saturday still expected a full day of work.
    if (!daySchedule.enabled) {
      return 0;
    }

    // Validate schedule has all required times
    if (!daySchedule.start || !daySchedule.end) {
      return null;
    }

    // Calculate work minutes from schedule
    const arrival = hmToMin(daySchedule.start);
    const departure = hmToMin(daySchedule.end);
    const pauseStart = daySchedule.lunchStart ? hmToMin(daySchedule.lunchStart) : null;
    const pauseEnd = daySchedule.lunchEnd ? hmToMin(daySchedule.lunchEnd) : null;

    // No lunch break
    if (!pauseStart || !pauseEnd) {
      return Math.max(0, departure - arrival);
    }

    // With lunch break: (pauseStart - arrival) + (departure - pauseEnd)
    const morning = Math.max(0, pauseStart - arrival);
    const afternoon = Math.max(0, departure - pauseEnd);
    return morning + afternoon;
  }

  // Mode 2: Same schedule for all days
  if (settings.baseHours.mode === "same" && settings.baseHours.same) {
    // Even in "same" mode the user declares WHICH days are worked.
    // Without this check a Saturday would inherit a full daily target and any
    // hour logged there would read as a deficit instead of overtime.
    const daySchedule = settings.baseHours.days?.[dayKey];
    if (daySchedule && !daySchedule.enabled) {
      return 0; // Day not worked -> no target, so any hour logged is overtime
    }

    const schedule = settings.baseHours.same;

    if (!schedule.start || !schedule.end) {
      return null;
    }

    const arrival = hmToMin(schedule.start);
    const departure = hmToMin(schedule.end);
    const pauseStart = schedule.lunchStart ? hmToMin(schedule.lunchStart) : null;
    const pauseEnd = schedule.lunchEnd ? hmToMin(schedule.lunchEnd) : null;

    // No lunch break
    if (!pauseStart || !pauseEnd) {
      return Math.max(0, departure - arrival);
    }

    // With lunch break
    const morning = Math.max(0, pauseStart - arrival);
    const afternoon = Math.max(0, departure - pauseEnd);
    return morning + afternoon;
  }

  return null;
}

/**
 * SINGLE SOURCE OF TRUTH: Gets the effective daily target in minutes for a specific date.
 * 
 * This is the core function that ALL components should use to determine daily targets.
 * It prioritizes schedule-based targets over the average calculation.
 * 
 * Priority order:
 * 1. Historical Snapshot (if entry exists and has frozen target) - NEW
 * 2. Per-day schedule (if configured)
 * 3. Same schedule for all days (if configured)
 * 4. Fallback: weeklyTarget / workDays (average)
 * 
 * @param date - ISO date string (YYYY-MM-DD)
 * @param settings - User settings
 * @param entry - Optional Time Entry (to check for snapshots)
 * @returns Daily target in minutes (always >= 0)
 */
export function getDailyTargetMinutes(
  date: string,
  settings: Settings,
  entry?: Entry
): number {
  // 1. Check for Historical Snapshot (Frozen Contract)
  if (entry?.customTargetMinutes !== undefined && entry.targetSource === 'snapshot') {
    return entry.customTargetMinutes;
  }

  // Parse date to get weekday
  const dateObj = new Date(date + "T12:00:00Z"); // Noon UTC to avoid timezone issues
  const weekday = dateObj.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  // Try to get planned work minutes from schedule
  const plannedMinutes = getPlannedWorkMinutesForWeekday(weekday, settings);

  if (plannedMinutes !== null) {
    return plannedMinutes;
  }

  // Fallback: Average daily target (weeklyTarget / workDays)
  if (settings.workDays > 0) {
    return Math.round((settings.weeklyTarget / settings.workDays) * 60);
  }

  // Edge case: No valid configuration
  return 0;
}

/**
 * Gets worked minutes for an entry.
 *
 * Wrapper around computeMinutes for consistency and future extensibility.
 *
 * @param entry - Time entry
 * @returns Total worked minutes (excluding lunch break)
 */
export function getWorkedMinutes(entry: Entry): number {
  return computeMinutes(entry);
}

/**
 * Statuses that suspend the daily target: nothing is expected to be worked,
 * so the day contributes neither surplus nor deficit.
 */
const ABSENCE_STATUSES = ["school", "vacation", "sick", "holiday"] as const;

/**
 * Whether a status is a justified absence (no target expected for that day).
 *
 * @param status - Entry status
 */
export function isAbsenceStatus(status: Entry["status"] | undefined): boolean {
  return ABSENCE_STATUSES.includes(status as typeof ABSENCE_STATUSES[number]);
}

/**
 * SINGLE SOURCE OF TRUTH: effective target for one entry, absences included.
 *
 * Unlike getDailyTargetMinutes (which answers "what is expected on that date"),
 * this answers "what is expected of THIS entry" - an absence expects nothing.
 *
 * @param entry - Time entry
 * @param settings - User settings
 * @returns Target in minutes (0 for absences and recovery days)
 */
export function getEffectiveTargetMinutes(entry: Entry, settings: Settings): number {
  if (isAbsenceStatus(entry.status) || entry.status === "recovery") {
    return 0;
  }
  return getDailyTargetMinutes(entry.date, settings, entry);
}

/**
 * SINGLE SOURCE OF TRUTH: daily overtime for one entry.
 *
 * Every view (dashboard, history table, overtime panel) MUST use this function.
 * Computing it locally is what made the same day read +0h on one screen and
 * -4h on another.
 *
 * Formula: worked + recoveryCredit - effectiveTarget
 *
 * The recovery credit covers the part of the day taken off: the balance is
 * debited once, through OvertimeState.usedMinutes, not twice.
 *
 * @param entry - Time entry
 * @param settings - User settings
 * @param events - All overtime events (recovery slots for that date are credited)
 * @returns Overtime in minutes (positive = surplus, negative = deficit)
 *
 * @example
 * // Worked 8h24, target 8h, no recovery
 * getDailyOvertimeMinutes(entry, settings, []) // -> +24
 *
 * @example
 * // Worked 4h, target 8h, 4h recovery taken that morning
 * getDailyOvertimeMinutes(entry, settings, events) // -> 0
 */
export function getDailyOvertimeMinutes(
  entry: Entry,
  settings: Settings,
  events: OvertimeEvent[] = []
): number {
  // Recovery days are accounted for through the overtime events, not here.
  if (entry.status === "recovery") return 0;

  const workedMinutes = getWorkedMinutes(entry);
  const recoveryMinutes = getRecoveryMinutesForDay(entry.date, events);
  const targetMinutes = getEffectiveTargetMinutes(entry, settings);

  return workedMinutes + recoveryMinutes - targetMinutes;
}

/**
 * Minutes a standalone recovery ENTRY deducts from the balance.
 *
 * A full-day recovery stores the raw clock span (e.g. 09:00-18:30) but must only
 * deduct the daily target (e.g. 7h48) - lunch is not recovered time. Used both
 * by the balance computation and by the history views, so they always agree.
 *
 * @param entry - Entry with status "recovery"
 * @param settings - User settings
 * @returns Minutes to deduct (>= 0)
 */
export function getRecoveryDeductionMinutes(entry: Entry, settings: Settings): number {
  if (!entry.start || !entry.end) return 0;

  const rawDuration = Math.max(0, hmToMin(entry.end) - hmToMin(entry.start));
  const dailyTarget = getDailyTargetMinutes(entry.date, settings, entry);

  return dailyTarget > 0 ? Math.min(rawDuration, dailyTarget) : rawDuration;
}
