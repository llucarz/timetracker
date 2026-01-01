/**
 * useOvertimeBalance Hook
 * 
 * Gère le calcul du solde overtime et ses dérivées.
 * Extrait de OvertimePanel.tsx (lignes 51-60).
 */

import { useMemo } from 'react';
import { OvertimeState, Settings } from '../../../lib/types';

export function useOvertimeBalance(otState: OvertimeState, settings: Settings) {
    const overtimeBalance = otState.balanceMinutes;
    const overtimeEarned = otState.earnedMinutes;
    const overtimeRecovered = otState.usedMinutes;

    // Calculate daily target
    const dailyTargetMinutes = useMemo(() => {
        if (!settings.workDays) return 0;
        return (settings.weeklyTarget / settings.workDays) * 60;
    }, [settings.weeklyTarget, settings.workDays]);

    return {
        overtimeBalance,
        overtimeEarned,
        overtimeRecovered,
        dailyTargetMinutes
    };
}
