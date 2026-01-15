/**
 * TimeTracker Business Logic - Single Source of Truth
 * 
 * Centralized functions for daily target and overtime calculations.
 * All UI components should use these functions instead of calculating targets locally.
 */

import { Entry, Settings } from "./types";
import { computeMinutes, hmToMin } from "./utils";

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
 * @returns Planned work minutes for that weekday, or null if no schedule configured
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
    
    if (!daySchedule || !daySchedule.enabled) {
      return null; // Day not worked
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
 * 1. Per-day schedule (if configured) - e.g., Mon-Thu = 8h, Fri = 7h
 * 2. Same schedule for all days (if configured) - e.g., always 7h30
 * 3. Fallback: weeklyTarget / workDays (average) - e.g., 39h / 5 = 7h48
 * 
 * @param date - ISO date string (YYYY-MM-DD)
 * @param settings - User settings
 * @returns Daily target in minutes (always >= 0)
 * 
 * @example
 * // User configured: Mon-Thu = 8h, Fri = 7h, weeklyTarget = 39h
 * getDailyTargetMinutes("2026-01-13", settings) // Monday → 480 min (8h)
 * getDailyTargetMinutes("2026-01-17", settings) // Friday → 420 min (7h)
 * 
 * @example
 * // User has no schedule configured, weeklyTarget = 35h, workDays = 5
 * getDailyTargetMinutes("2026-01-13", settings) // → 420 min (7h, fallback)
 */
export function getDailyTargetMinutes(date: string, settings: Settings): number {
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
 * Calculates daily overtime for a single entry.
 * 
 * Formula: workedMinutes - (effectiveTargetMinutes - giftMinutes)
 * 
 * Gift minutes REDUCE the target (they don't add to worked time).
 * Example: Target 8h, gift 30min → effective target 7h30
 * 
 * @param entry - Time entry
 * @param settings - User settings
 * @param giftMinutes - Gift/recovery minutes for this day (reduces target)
 * @returns Overtime in minutes (positive = surplus, negative = deficit)
 * 
 * @example
 * // Worked 8h24, target 8h, no gift
 * getDailyOvertimeMinutes(entry, settings, 0) // → +24 minutes
 * 
 * @example
 * // Worked 8h00, target 8h, gift 30min
 * getDailyOvertimeMinutes(entry, settings, 30) // → +30 minutes (target reduced to 7h30)
 */
export function getDailyOvertimeMinutes(
  entry: Entry,
  settings: Settings,
  giftMinutes: number = 0
): number {
  const workedMinutes = getWorkedMinutes(entry);
  const baseTargetMinutes = getDailyTargetMinutes(entry.date, settings);
  const effectiveTargetMinutes = Math.max(0, baseTargetMinutes - giftMinutes);

  return workedMinutes - effectiveTargetMinutes;
}
