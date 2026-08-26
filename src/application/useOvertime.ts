/**
 * useOvertime - Application Hook
 * 
 * Gère le state overtime avec auto-recalcul.
 * Utilise OvertimeDomain et OvertimeCalculator.
 */

import { useState, useEffect, useCallback } from 'react';
import { Entry, Settings, OvertimeState, OvertimeEvent } from '../lib/types';
import { storage } from '../lib/storage';
import { OvertimeDomain, OvertimeCalculator } from '../domain';

const defaultOtState: OvertimeState = {
    balanceMinutes: 0,
    earnedMinutes: 0,
    usedMinutes: 0,
    events: []
};

export function useOvertime(
    entries: Entry[],
    settings: Settings,
    entriesLoaded: boolean,
    settingsLoaded: boolean
) {
    const [otState, setOtState] = useState<OvertimeState>(defaultOtState);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage
    useEffect(() => {
        const loadData = async () => {
            try {
                const loaded = await storage.getOvertimeState();
                // Never trust a persisted usedMinutes: derive it from the events.
                setOtState(loaded ? OvertimeDomain.withDerivedTotals(loaded) : defaultOtState);
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load overtime state:', error);
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    // Auto-recalculate when entries, settings OR events change.
    //
    // otState.events matters: adding a recovery debits usedMinutes immediately,
    // while the matching credit lives in earnedMinutes. Leaving events out of the
    // deps left the balance wrong by exactly the recovery amount until the next
    // reload. settings matters too: baseHours drives every daily target.
    useEffect(() => {
        if (!isLoaded || !entriesLoaded || !settingsLoaded) return;

        setOtState(prevState => {
            const recalculated = OvertimeCalculator.recalculateState(
                prevState,
                entries,
                settings
            );

            // Only update if values changed (prevent loops)
            if (OvertimeCalculator.hasChanged(prevState, recalculated)) {
                return recalculated;
            }
            return prevState;
        });
    }, [entries, settings, otState.events, isLoaded, entriesLoaded, settingsLoaded]);

    // Persist to storage
    useEffect(() => {
        if (!isLoaded) return;

        const persist = async () => {
            try {
                await storage.updateOvertimeState(otState);
            } catch (error) {
                console.error('Failed to persist overtime state:', error);
            }
        };
        persist();
    }, [otState, isLoaded]);

    const addOvertimeEvent = useCallback((event: Omit<OvertimeEvent, 'id'>) => {
        const newEvent = OvertimeDomain.createEvent(event);
        setOtState(prev => OvertimeDomain.addEvent(prev, newEvent));
    }, []);

    const deleteOvertimeEvent = useCallback((id: string) => {
        setOtState(prev => OvertimeDomain.removeEvent(prev, id));
    }, []);

    /**
     * Restore overtime state from cloud data.
     *
     * Merges by event id rather than comparing list lengths: the number of events
     * is not a freshness signal. A local event the cloud has not seen yet is kept,
     * and a cloud event missing locally is restored.
     */
    const setOvertimeFromCloud = useCallback((cloudState: OvertimeState) => {
        setOtState(prev => {
            const byId = new Map<string, OvertimeEvent>();
            (cloudState.events || []).forEach(e => { if (e?.id) byId.set(e.id, e); });
            (prev.events || []).forEach(e => { if (e?.id) byId.set(e.id, e); });

            return OvertimeDomain.withDerivedTotals({
                ...prev,
                events: Array.from(byId.values())
            });
        });
    }, []);

    return {
        otState,
        isLoaded,
        addOvertimeEvent,
        deleteOvertimeEvent,
        setOvertimeFromCloud
    };
}
