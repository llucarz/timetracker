/**
 * usePeriodNavigation Hook
 * 
 * Gère la navigation entre périodes (semaine/mois/année).
 * Extrait de WeeklyView.tsx.
 */

import { useCallback } from 'react';

export function usePeriodNavigation(
    period: 'week' | 'month' | 'year',
    currentDate: Date,
    setCurrentDate: (date: Date) => void
) {
    const handlePrevious = useCallback(() => {
        const newDate = new Date(currentDate);
        if (period === 'week') newDate.setDate(newDate.getDate() - 7);
        else if (period === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (period === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
        setCurrentDate(newDate);
    }, [currentDate, period, setCurrentDate]);

    const handleNext = useCallback(() => {
        const newDate = new Date(currentDate);
        if (period === 'week') newDate.setDate(newDate.getDate() + 7);
        else if (period === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (period === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
        setCurrentDate(newDate);
    }, [currentDate, period, setCurrentDate]);

    return {
        handlePrevious,
        handleNext
    };
}
