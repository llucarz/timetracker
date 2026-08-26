/**
 * OvertimeDomain - Domain Model
 *
 * Operations sur le modèle Overtime (events, state).
 * Pure functions, no side effects.
 */

import { OvertimeState, OvertimeEvent } from '../../lib/types';
import { getUsedMinutes } from '../../lib/utils';

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
     * Recalcule usedMinutes et balanceMinutes à partir de la liste d'événements.
     *
     * usedMinutes est TOUJOURS dérivé, jamais incrémenté : un compteur incrémental
     * dérive définitivement dès qu'un événement entre ou sort en dehors du chemin
     * normal (restauration cloud, migration de stockage, second onglet).
     */
    static withDerivedTotals(state: OvertimeState): OvertimeState {
        const events = state.events || [];
        const usedMinutes = getUsedMinutes(events);

        return {
            ...state,
            events,
            usedMinutes,
            balanceMinutes: state.earnedMinutes - usedMinutes
        };
    }

    /**
     * Ajoute un événement au state
     */
    static addEvent(
        state: OvertimeState,
        event: OvertimeEvent
    ): OvertimeState {
        return OvertimeDomain.withDerivedTotals({
            ...state,
            events: [...state.events, event]
        });
    }

    /**
     * Supprime un événement du state
     */
    static removeEvent(
        state: OvertimeState,
        eventId: string
    ): OvertimeState {
        if (!state.events.some(e => e.id === eventId)) return state;

        return OvertimeDomain.withDerivedTotals({
            ...state,
            events: state.events.filter(e => e.id !== eventId)
        });
    }
}
