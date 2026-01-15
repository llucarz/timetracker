/**
 * useCloudSync - Application Hook
 * 
 * Gère la synchronisation cloud (debounced auto-sync).
 */

import { useState, useEffect, useCallback } from 'react';
import { Entry, Settings, OvertimeState } from '../lib/types';

export function useCloudSync(
    entries: Entry[],
    settings: Settings,
    otState: OvertimeState,
    isDataLoaded: boolean
) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<string | null>(null);

    const syncWithCloud = useCallback(async () => {
        if (!settings.account?.key || settings.account.isOffline) return;

        setIsSyncing(true);
        setLastSyncError(null);

        try {
            const res = await fetch(`/api/data?key=${settings.account.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries, settings, overtime: otState }),
            });

            if (!res.ok) {
                throw new Error(`Sync failed: ${res.status}`);
            }
        } catch (error) {
            console.error('Cloud sync failed:', error);
            setLastSyncError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsSyncing(false);
        }
    }, [entries, settings, otState]);

    const loadFromCloud = useCallback(async () => {
        if (!settings.account?.key || settings.account.isOffline) return null;

        try {
            const res = await fetch(`/api/data?key=${settings.account.key}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (error) {
            console.error('Cloud load failed:', error);
            return null;
        }
    }, [settings.account]);

    // Auto-sync with debounce (2 seconds)
    useEffect(() => {
        if (!isDataLoaded || !settings.account?.key) return;

        const timeout = setTimeout(() => {
            syncWithCloud();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [entries, settings, otState, isDataLoaded, syncWithCloud]);

    return {
        isSyncing,
        lastSyncError,
        syncWithCloud,
        loadFromCloud
    };
}
