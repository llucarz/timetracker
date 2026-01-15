/**
 * useOvertimeBalance Hook
 * 
 * Gère le calcul du solde overtime et ses dérivées.
 * Extrait de OvertimePanel.tsx (lignes 51-60).
 * 
 * Note: Daily target calculation has been moved to getDailyTargetMinutes()
 * in logic.ts to support per-day schedules.
 */

import { OvertimeState } from '../../../lib/types';

export function useOvertimeBalance(otState: OvertimeState) {
    const overtimeBalance = otState.balanceMinutes;
    const overtimeEarned = otState.earnedMinutes;
    const overtimeRecovered = otState.usedMinutes;

    return {
        overtimeBalance,
        overtimeEarned,
        overtimeRecovered
    };
}
