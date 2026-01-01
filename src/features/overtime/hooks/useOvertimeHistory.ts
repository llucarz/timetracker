/**
 * useOvertimeHistory Hook
 * 
 * Calcule l'historique combiné (earned + recovered).
 * Extrait de OvertimePanel.tsx (lignes 63-102).
 */

import { useMemo } from 'react';
import { Entry, OvertimeState } from '../../../lib/types';
import { computeMinutes, getRecoveryMinutesForDay } from '../../../lib/utils';

export interface HistoryItem {
    id: string;
    date: string;
    type: 'earned' | 'recovered';
    minutes: number;
    comment?: string;
    isManual: boolean;
    start?: string;
    end?: string;
}

export function useOvertimeHistory(
    otState: OvertimeState,
    entries: Entry[],
    dailyTargetMinutes: number
) {
    return useMemo(() => {
        const items: HistoryItem[] = [];

        // 1. Recoveries (Manual events)
        otState.events.forEach(event => {
            items.push({
                id: event.id,
                date: event.date,
                type: 'recovered',
                minutes: event.minutes,
                comment: event.note,
                isManual: true,
                start: event.start,
                end: event.end
            });
        });

        // 2. Earned (Daily positive delta)
        entries.forEach(entry => {
            if (entry.status && entry.status !== 'work') return; // Only work days

            const workMinutes = computeMinutes(entry);
            const recoveryMinutes = getRecoveryMinutesForDay(entry.date, otState.events);
            const totalMinutes = workMinutes + recoveryMinutes;
            const delta = totalMinutes - dailyTargetMinutes;

            if (delta > 0) {
                items.push({
                    id: `earned-${entry.id}`,
                    date: entry.date,
                    type: 'earned',
                    minutes: delta,
                    comment: 'Heures supplémentaires',
                    isManual: false
                });
            }
        });

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [otState.events, entries, dailyTargetMinutes]);
}
