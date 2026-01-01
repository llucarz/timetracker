/**
 * TimeTracker Type Definitions
 * 
 * Core data models for the time tracking application
 */

/**
 * Time Entry - Represents a single day's work record
 * One entry per date; new entries replace existing ones for the same date
 */
export interface Entry {
  /** Unique identifier (crypto.randomUUID()) */
  id: string;

  /** ISO date string (YYYY-MM-DD) - must be unique per entry */
  date: string;

  /** Arrival time (HH:MM format, e.g., "09:00") */
  start: string;

  /** Lunch break start time (HH:MM) */
  lunchStart: string;

  /** Lunch break end time (HH:MM) */
  lunchEnd: string;

  /** Departure time (HH:MM) */
  end: string;

  /** Optional notes or comments for this day */
  notes: string;

  /** Day status - affects overtime calculation:
   * - "work": Normal working day (default)
   * - "school": Training/education day (reduces weekly target)
   * - "vacation": PTO day (reduces weekly target)
   * - "sick": Sick leave (reduces weekly target)
   * - "holiday": Public holiday (reduces weekly target)
   */
  status: "work" | "school" | "vacation" | "sick" | "holiday" | "recovery";

  /** Timestamp for sync conflict resolution (Date.now()) */
  updatedAt?: number;
}

/**
 * User Settings - Configuration and preferences
 */
export interface Settings {
  /** Whether user has completed onboarding flow */
  isOnboarded?: boolean;

  /** Target working hours per week (e.g., 35) */
  weeklyTarget: number;

  /** Number of working days per week (e.g., 5 for Mon-Fri) */
  workDays: number;

  /** @deprecated Legacy field, use account.key instead */
  cloudKey?: string;

  /** Cloud sync account information */
  account?: {
    /** User's full name */
    name: string;

    /** Company name */
    company: string;

    /** Generated account key for Redis storage (format: "acct:<company>:<name>") */
    key: string;

    /** Whether account is in offline mode (failed sync) */
    isOffline?: boolean;
  } | null;

  /** Base schedule configuration - user's usual work hours */
  baseHours?: {
    /** Schedule mode:
     * - "same": Use same schedule for all days
     * - "per-day": Different schedule per day of week
     */
    mode: "same" | "per-day";

    /** Template schedule when mode = "same" */
    same: {
      start: string;
      lunchStart: string;
      lunchEnd: string;
      end: string;
    };

    /** Per-day schedules when mode = "per-day"
     * Keys: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
     */
    days: Record<string, {
      /** Whether this day is a working day */
      enabled: boolean;
      start: string;
      lunchStart: string;
      lunchEnd: string;
      end: string;
    }>;
  };
}

/**
 * Overtime Event - Records overtime consumption and recovery
 */
export interface OvertimeEvent {
  /** Unique identifier (crypto.randomUUID()) */
  id: string;

  /** ISO date string (YYYY-MM-DD) when event occurred */
  date: string;

  /** Minutes value:
   * - Positive: Recovery event (adds to earned minutes)
   * - Negative: Consumption event (reduces balance)
   */
  minutes: number;

  /** Optional start time (HH:MM) for time-blocked recovery
   * When set, prevents work entry during this time slot
   */
  start?: string;

  /** Optional end time (HH:MM) for time-blocked recovery */
  end?: string;

  /** User note/description of event (e.g., "RTT récupéré", "Heures sup utilisées") */
  note: string;
}

/**
 * Overtime State - Tracks overall overtime balance
 */
export interface OvertimeState {
  /** Current balance in minutes (earned - used) */
  balanceMinutes: number;

  /** Total overtime earned (auto-calculated from entries + recovery events) */
  earnedMinutes: number;

  /** Total overtime consumed (sum of negative events) */
  usedMinutes: number;

  /** All overtime events (consumption + recovery) */
  events: OvertimeEvent[];
}
