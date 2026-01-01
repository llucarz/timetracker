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
                setOtState(loaded || defaultOtState);
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load overtime state:', error);
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    // Auto-recalculate when entries or settings change
    useEffect(() => {
        if (!isLoaded || !entriesLoaded || !settingsLoaded) return;

        const recalculated = OvertimeCalculator.recalculateState(
            otState,
            entries,
            settings
        );

        // Only update if values changed (prevent loops)
        if (OvertimeCalculator.hasChanged(otState, recalculated)) {
            setOtState(recalculated);
        }
    }, [entries, settings.weeklyTarget, settings.workDays, isLoaded, entriesLoaded, settingsLoaded]);

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

    return {
        otState,
        isLoaded,
        addOvertimeEvent,
        deleteOvertimeEvent
    };
}
