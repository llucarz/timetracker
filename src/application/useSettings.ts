/**
 * useSettings - Application Hook
 * 
 * Gère le state et la persistence des settings.
 */

import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../lib/types';
import { storage } from '../lib/storage';

const defaultSettings: Settings = {
    isOnboarded: false,
    weeklyTarget: 35,
    workDays: 5,
    baseHours: {
        mode: 'same',
        same: { start: '', lunchStart: '', lunchEnd: '', end: '' },
        days: {
            mon: { enabled: true, start: '', lunchStart: '', lunchEnd: '', end: '' },
            tue: { enabled: true, start: '', lunchStart: '', lunchEnd: '', end: '' },
            wed: { enabled: true, start: '', lunchStart: '', lunchEnd: '', end: '' },
            thu: { enabled: true, start: '', lunchStart: '', lunchEnd: '', end: '' },
            fri: { enabled: true, start: '', lunchStart: '', lunchEnd: '', end: '' },
            sat: { enabled: false, start: '', lunchStart: '', lunchEnd: '', end: '' },
            sun: { enabled: false, start: '', lunchStart: '', lunchEnd: '', end: '' },
        }
    }
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage
    useEffect(() => {
        const loadData = async () => {
            try {
                const loaded = await storage.getSettings();
                setSettings(loaded || defaultSettings);
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load settings:', error);
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    // Persist to storage
    useEffect(() => {
        if (!isLoaded) return;

        const persist = async () => {
            try {
                await storage.updateSettings(settings);
            } catch (error) {
                console.error('Failed to persist settings:', error);
            }
        };
        persist();
    }, [settings, isLoaded]);

    const updateSettings = useCallback((updates: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    return {
        settings,
        isLoaded,
        updateSettings
    };
}
