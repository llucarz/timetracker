/**
 * useEntryStats Hook
 * 
 * Calcule les statistiques des entrées (aujourd'hui, semaine, mois, année).
 * Extrait de WeeklyView.tsx (lignes 87-187).
 */

import { useMemo } from 'react';
import { Entry, Settings } from '../../../lib/types';
import { minToHM, computeMinutes, formatDuration } from '../../../lib/utils';

export function useEntryStats(
    entries: Entry[],
    settings: Settings,
    currentDate: Date
) {
    return useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const anchor = new Date(currentDate);

        // Start of week (Monday) based on currentDate
        const startOfWeek = new Date(anchor);
        const day = startOfWeek.getDay() || 7; // Get current day number, converting Sun (0) to 7
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        // Start of month based on currentDate
        const startOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const endOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);

        // Start of year based on currentDate
        const startOfYear = new Date(anchor.getFullYear(), 0, 1);
        const endOfYear = new Date(anchor.getFullYear() + 1, 0, 1);

        let todayMinutes = 0;
        let weekMinutes = 0;
        let monthMinutes = 0;
        let yearMinutes = 0;

        let absenceDaysInWeek = 0;
        let absenceDaysInMonth = 0;
        const workDaysInWeekSet = new Set<string>();
        const workDaysInMonthSet = new Set<string>();

        const dailyTargetMinutes = (settings.weeklyTarget / settings.workDays) * 60;

        entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            const minutes = computeMinutes(entry);
            const dayOfWeek = entryDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isAbsence = ['school', 'vacation', 'sick', 'holiday'].includes(entry.status);
            const isWork = !entry.status || entry.status === 'work';

            if (entry.date === today) {
                todayMinutes += minutes;
            }

            // Week stats
            if (entryDate >= startOfWeek && entryDate < endOfWeek) {
                weekMinutes += minutes;
                if (isAbsence && !isWeekend) {
                    absenceDaysInWeek++;
                }
                if (isWork) {
                    workDaysInWeekSet.add(entry.date);
                }
            }

            // Month stats
            if (entryDate >= startOfMonth && entryDate < endOfMonth) {
                monthMinutes += minutes;
                if (isAbsence && !isWeekend) {
                    absenceDaysInMonth++;
                }
                if (isWork) {
                    workDaysInMonthSet.add(entry.date);
                }
            }

            // Year stats
            if (entryDate >= startOfYear && entryDate < endOfYear) {
                yearMinutes += minutes;
            }
        });

        // Calculate Weekly Overtime
        // Target is based on logged work days only (no penalty for absences or missing days)
        const adjustedWeeklyTargetMinutes = workDaysInWeekSet.size * dailyTargetMinutes;
        const weeklyOvertime = weekMinutes - adjustedWeeklyTargetMinutes;
        const weeklyOvertimeStr = formatDuration(weeklyOvertime);
        const weeklySubtitle = weeklyOvertime > 0
            ? `+${weeklyOvertimeStr} vs objectif`
            : `${weeklyOvertimeStr} vs objectif`;

        // Calculate Monthly Overtime
        // Target is based on logged work days only
        const adjustedMonthlyTargetMinutes = workDaysInMonthSet.size * dailyTargetMinutes;
        const monthlyOvertime = monthMinutes - adjustedMonthlyTargetMinutes;
        const monthlyOvertimeStr = formatDuration(monthlyOvertime);
        const monthlySubtitle = monthlyOvertime > 0
            ? `+${monthlyOvertimeStr} vs objectif`
            : `${monthlyOvertimeStr} vs objectif`;

        return {
            today: minToHM(todayMinutes),
            week: minToHM(weekMinutes),
            month: minToHM(monthMinutes),
            year: minToHM(yearMinutes),
            weeklySubtitle,
            monthlySubtitle
        };
    }, [entries, settings, currentDate]);
}
