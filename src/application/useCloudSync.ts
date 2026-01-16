/**
 * useCloudSync - Application Hook
 * 
 * Gère la synchronisation cloud immédiate (immediate sync on every action).
 * - Sync immédiat après chaque modification (plus de debounce)
 * - Chargement automatique depuis la BDD au démarrage
 * - Indicateur isSynced pour vérifier que localStorage === BDD
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Entry, Settings, OvertimeState } from '../lib/types';

export function useCloudSync(
    entries: Entry[],
    settings: Settings,
    otState: OvertimeState,
    isDataLoaded: boolean
) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<string | null>(null);
    const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState(false);

    // Track if we need to sync (data has changed since last sync)
    const needsSyncRef = useRef(false);

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

            setIsSynced(true);
            needsSyncRef.current = false;
            console.log('✅ Cloud sync successful');
        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            setLastSyncError(error instanceof Error ? error.message : 'Unknown error');
            setIsSynced(false);
        } finally {
            setIsSyncing(false);
        }
    }, [entries, settings, otState]);

    const loadFromCloud = useCallback(async () => {
        if (!settings.account?.key || settings.account.isOffline) return null;

        try {
            const res = await fetch(`/api/data?key=${settings.account.key}`);
            if (!res.ok) return null;
            const data = await res.json();
            console.log('✅ Cloud data loaded');
            return data;
        } catch (error) {
            console.error('❌ Cloud load failed:', error);
            return null;
        }
    }, [settings.account]);

    // Immediate sync function (exposed to context)
    const syncNow = useCallback(async () => {
        if (!isDataLoaded || !settings.account?.key || settings.account.isOffline) return;
        if (isSyncing) {
            // Mark that we need to sync again after current sync completes
            needsSyncRef.current = true;
            return;
        }

        await syncWithCloud();
    }, [isDataLoaded, settings.account, isSyncing, syncWithCloud]);

    // Load from cloud on initial mount (only once)
    useEffect(() => {
        if (!isDataLoaded || hasLoadedFromCloud) return;
        if (!settings.account?.key || settings.account.isOffline) return;

        const loadInitialData = async () => {
            console.log('🔄 Loading initial data from cloud...');
            const cloudData = await loadFromCloud();

            if (cloudData) {
                // Data will be merged by the context/parent component
                setHasLoadedFromCloud(true);
                setIsSynced(true);
            }
        };

        loadInitialData();
    }, [isDataLoaded, settings.account, hasLoadedFromCloud, loadFromCloud]);

    // Mark as needing sync when data changes
    useEffect(() => {
        if (!isDataLoaded || !hasLoadedFromCloud) return;
        if (!settings.account?.key || settings.account.isOffline) return;

        // Data has changed, mark as not synced
        setIsSynced(false);
        needsSyncRef.current = true;
    }, [entries, settings, otState, isDataLoaded, hasLoadedFromCloud]);

    // Retry sync if needed after current sync completes
    useEffect(() => {
        if (!isSyncing && needsSyncRef.current && isDataLoaded) {
            syncNow();
        }
    }, [isSyncing, isDataLoaded, syncNow]);

    return {
        isSyncing,
        isSynced,
        lastSyncError,
        syncWithCloud,
        syncNow,
        loadFromCloud
    };
}
