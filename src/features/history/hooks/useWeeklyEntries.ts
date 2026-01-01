/**
 * useWeeklyEntries Hook
 *  
 * Gère le filtrage et le grouping des entrées par période (semaine/mois/année).
 * Extrait de WeeklyView.tsx pour réutilisabilité et testabilité.
 */

import { useMemo } from 'react';
import { Entry } from '../../../lib/types';

export function useWeeklyEntries(
    entries: Entry[],
    period: 'week' | 'month' | 'year',
    currentDate: Date
) {
    // Filter entries based on period and currentDate
    const filteredEntries = useMemo(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (period === 'week') {
            const day = start.getDay() || 7;
            if (day !== 1) start.setHours(-24 * (day - 1));
            start.setHours(0, 0, 0, 0);
            end.setTime(start.getTime() + 6 * 24 * 60 * 60 * 1000);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'year') {
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(11, 31);
            end.setHours(23, 59, 59, 999);
        }

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        return entries
            .filter(e => e.date >= startStr && e.date <= endStr)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [entries, period, currentDate]);

    // Group entries by day (if needed in the future)
    const groupedByDay = useMemo(() => {
        const grouped = new Map<string, Entry[]>();
        filteredEntries.forEach(entry => {
            const existing = grouped.get(entry.date) || [];
            grouped.set(entry.date, [...existing, entry]);
        });
        return grouped;
    }, [filteredEntries]);

    return {
        filteredEntries,
        groupedByDay
    };
}
