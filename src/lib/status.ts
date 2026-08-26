/**
 * Entry status labels - single source of truth for the UI.
 *
 * Was duplicated in Dashboard and WeeklyView with different contents: the
 * dashboard copy was missing "recovery", which surfaced the raw English key to
 * the user, and carried an "off" status that exists in no type.
 */

import { Entry } from "./types";

export const STATUS_LABELS: Record<Entry["status"], string> = {
  work: "Travail",
  school: "École",
  vacation: "Congés",
  sick: "Maladie",
  holiday: "Férié",
  recovery: "Récupération",
};

/**
 * Human label for an entry status, safe against unknown/legacy values.
 *
 * @param status - Entry status (may be undefined on legacy entries)
 * @returns French label
 */
export function getStatusLabel(status: Entry["status"] | undefined): string {
  if (!status) return STATUS_LABELS.work;
  return STATUS_LABELS[status] || status;
}
