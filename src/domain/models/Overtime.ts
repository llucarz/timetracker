/**
 * OvertimeDomain - Domain Model
 * 
 * Operations sur le modèle Overtime (events, state).
 * Pure functions, no side effects.
 */

import { OvertimeState, OvertimeEvent } from '../../lib/types';

export class OvertimeDomain {
    /**
     * Crée un nouvel événement overtime avec ID
     */
    static createEvent(data: Omit<OvertimeEvent, 'id'>): OvertimeEvent {
        return {
            ...data,
            id: crypto.randomUUID()
        };
    }

    /**
     * Ajoute un événement au state
     * Ajuste usedMinutes et balance
     */
    static addEvent(
        state: OvertimeState,
        event: OvertimeEvent
    ): OvertimeState {
        // Only negative minutes (consumption) count towards usedMinutes
        const usedDelta = event.minutes < 0 ? Math.abs(event.minutes) : 0;
        const newUsed = state.usedMinutes + usedDelta;

        return {
            ...state,
            usedMinutes: newUsed,
            balanceMinutes: state.earnedMinutes - newUsed,
            events: [...state.events, event]
        };
    }

    /**
     * Supprime un événement du state
     * Ajuste usedMinutes et balance
     */
    static removeEvent(
        state: OvertimeState,
        eventId: string
    ): OvertimeState {
        const event = state.events.find(e => e.id === eventId);
        if (!event) return state;

        const usedDelta = event.minutes < 0 ? Math.abs(event.minutes) : 0;
        const newUsed = Math.max(0, state.usedMinutes - usedDelta);

        return {
            ...state,
            usedMinutes: newUsed,
            balanceMinutes: state.earnedMinutes - newUsed,
            events: state.events.filter(e => e.id !== eventId)
        };
    }
}
