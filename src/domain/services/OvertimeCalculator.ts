/**
 * OvertimeCalculator - Domain Service
 *
 * Pure business logic for overtime calculations.
 * NO React dependencies, fully testable.
 */

import { Entry, OvertimeState, Settings } from '../../lib/types';
import { computeOvertimeEarned, getUsedMinutes } from '../../lib/utils';

export class OvertimeCalculator {
    /**
     * Recalcule l'état overtime complet.
     *
     * Les trois totaux sont dérivés du même couple (entries, events) à chaque
     * passage : earned, used et balance ne peuvent donc pas diverger.
     */
    static recalculateState(
        currentState: OvertimeState,
        entries: Entry[],
        settings: Settings
    ): OvertimeState {
        const events = currentState.events || [];

        const earnedMinutes = computeOvertimeEarned(entries, settings, events);
        const usedMinutes = getUsedMinutes(events);

        return {
            ...currentState,
            events,
            earnedMinutes,
            usedMinutes,
            balanceMinutes: earnedMinutes - usedMinutes
        };
    }

    /**
     * Vérifie si le recalcul a changé l'état
     */
    static hasChanged(oldState: OvertimeState, newState: OvertimeState): boolean {
        return oldState.earnedMinutes !== newState.earnedMinutes ||
            oldState.usedMinutes !== newState.usedMinutes ||
            oldState.balanceMinutes !== newState.balanceMinutes;
    }
}
