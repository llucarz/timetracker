/**
 * Overtime history - the itemised view of how the balance was built.
 *
 * SINGLE SOURCE OF TRUTH, shared by the overtime panel and the CSV export.
 * Recomputing this list per screen is exactly what made the same day read
 * differently depending on where you looked.
 */

import { Entry, OvertimeEvent, Settings } from "./types";
import { getDailyOvertimeMinutes, getRecoveryDeductionMinutes } from "./logic";

export interface HistoryItem {
  id: string;
  date: string;
  /** earned = surplus, recovered = time taken back, deficit = hours missing */
  type: "earned" | "recovered" | "deficit";
  /** Always positive; `type` carries the direction. */
  minutes: number;
  comment?: string;
  /** Whether the user created it by hand (and can therefore delete it). */
  isManual: boolean;
  start?: string;
  end?: string;
  source: "entry" | "event";
}

/**
 * Builds the full list of overtime movements, most recent first.
 *
 * @param entries - All time entries
 * @param settings - User settings
 * @param events - All overtime events
 * @returns Movements sorted by date, descending
 */
export function buildOvertimeHistory(
  entries: Entry[],
  settings: Settings,
  events: OvertimeEvent[]
): HistoryItem[] {
  const items: HistoryItem[] = [];

  // 1. Manual adjustments (from events)
  events.forEach(event => {
    items.push({
      id: event.id,
      date: event.date,
      type: event.minutes > 0 ? "earned" : "recovered",
      minutes: Math.abs(event.minutes),
      comment: event.note,
      isManual: true,
      start: event.start,
      end: event.end,
      source: "event",
    });
  });

  // 2. Earned / deficit from work entries, plus standalone recovery entries
  entries.forEach(entry => {
    if (entry.status === "recovery") {
      // A recovery paired with an event is already listed above (RecoveryForm
      // creates both); listing it twice would double the figure.
      const hasPairedEvent = events.some(ev => ev.date === entry.date && ev.minutes < 0);
      if (hasPairedEvent) return;

      const duration = getRecoveryDeductionMinutes(entry, settings);
      if (duration > 0) {
        items.push({
          id: entry.id,
          date: entry.date,
          type: "recovered",
          minutes: duration,
          comment: entry.notes || "Récupération",
          isManual: true,
          start: entry.start,
          end: entry.end,
          source: "entry",
        });
      }
      return;
    }

    if (!entry.status || entry.status !== "work") return;

    const delta = getDailyOvertimeMinutes(entry, settings, events);

    if (delta > 0) {
      items.push({
        id: `earned-${entry.id}`,
        date: entry.date,
        type: "earned",
        minutes: delta,
        comment: "Heures supplémentaires",
        isManual: false,
        source: "entry",
      });
    } else if (delta < 0) {
      items.push({
        id: `deficit-${entry.id}`,
        date: entry.date,
        type: "deficit",
        minutes: Math.abs(delta),
        comment: "Absence non justifiée",
        isManual: false,
        source: "entry",
      });
    }
  });

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Nets a list of movements into the totals shown at the bottom of an export.
 *
 * @param items - Movements, typically already filtered to a period
 * @returns Earned, recovered, deficit and the resulting net balance, in minutes
 */
export function summariseHistory(items: HistoryItem[]) {
  let earned = 0;
  let recovered = 0;
  let deficit = 0;

  items.forEach(item => {
    if (item.type === "earned") earned += item.minutes;
    else if (item.type === "recovered") recovered += item.minutes;
    else deficit += item.minutes;
  });

  return { earned, recovered, deficit, net: earned - recovered - deficit };
}

/** French label for a movement type. */
export const HISTORY_TYPE_LABELS: Record<HistoryItem["type"], string> = {
  earned: "Heures supplémentaires",
  recovered: "Récupération",
  deficit: "Absence non justifiée",
};
