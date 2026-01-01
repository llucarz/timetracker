/**
 * OvertimeCalculator - Domain Service
 * 
 * Pure business logic for overtime calculations.
 * NO React dependencies, fully testable.
 */

import { Entry, OvertimeState, OvertimeEvent, Settings } from '../../lib/types';
import { computeOvertimeEarned } from '../../lib/utils';

export class OvertimeCalculator {
    /**
     * Recalcule l'état overtime complet
     * Appelé quand entries ou settings changent
     */
    static recalculateState(
        currentState: OvertimeState,
        entries: Entry[],
        settings: Settings
    ): OvertimeState {
        const earned = computeOvertimeEarned(
            entries,
            settings.weeklyTarget,
            settings.workDays,
            currentState.events
        );

        return {
            ...currentState,
            earnedMinutes: earned,
            balanceMinutes: earned - currentState.usedMinutes
        };
    }

    /**
     * Vérifie si le recalcul a changé l'état
     */
    static hasChanged(oldState: OvertimeState, newState: OvertimeState): boolean {
        return oldState.earnedMinutes !== newState.earnedMinutes ||
            oldState.balanceMinutes !== newState.balanceMinutes;
    }
}
