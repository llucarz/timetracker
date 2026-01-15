/**
 * useCloudSync - Application Hook
 * 
 * Gère la synchronisation cloud avec vérification d'intégrité par hash.
 * Le statut "synced" n'est affiché que lorsque les données locales
 * correspondent exactement aux données en BDD.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Entry, Settings, OvertimeState } from '../lib/types';
import CryptoJS from 'crypto-js';

/**
 * Generate MD5 hash of data for sync verification
 * Must match the server-side hash generation algorithm
 */
function generateHash(data: any): string {
    return CryptoJS.MD5(JSON.stringify(data)).toString();
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'pending';

export function useCloudSync(
    entries: Entry[],
    settings: Settings,
    otState: OvertimeState,
    isDataLoaded: boolean
) {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('pending');
    const [lastSyncError, setLastSyncError] = useState<string | null>(null);
    const [lastSyncedHash, setLastSyncedHash] = useState<string | null>(null);
    const retryCountRef = useRef(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const syncWithCloud = useCallback(async () => {
        if (!settings.account?.key || settings.account.isOffline) {
            setSyncStatus('pending');
            return;
        }

        setSyncStatus('syncing');
        setLastSyncError(null);

        try {
            // Prepare data to sync
            const dataToSync = {
                entries,
                settings,
                overtime: otState
            };

            // Generate local hash for verification
            const localHash = generateHash(dataToSync);

            // Check if data has changed since last sync
            if (localHash === lastSyncedHash) {
                setSyncStatus('synced');
                return;
            }

            // Send data to server
            const res = await fetch(`/api/data?key=${settings.account.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSync),
            });

            if (!res.ok) {
                throw new Error(`Sync failed: ${res.status} ${res.statusText}`);
            }

            const result = await res.json();

            // Verify hash matches
            if (result.hash !== localHash) {
                throw new Error('Sync verification failed: hash mismatch. Data may be corrupted.');
            }

            // Success! Data is verified as synced
            setSyncStatus('synced');
            setLastSyncedHash(localHash);
            retryCountRef.current = 0;

            console.log('✅ Sync successful, verified at:', result.savedAt);
        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setLastSyncError(errorMessage);
            setSyncStatus('error');

            // Retry logic with exponential backoff (max 3 attempts)
            if (retryCountRef.current < 3) {
                const retryDelay = 5000 * Math.pow(2, retryCountRef.current); // 5s, 10s, 20s
                console.log(`🔄 Retrying sync in ${retryDelay / 1000}s (attempt ${retryCountRef.current + 1}/3)`);

                retryTimeoutRef.current = setTimeout(() => {
                    retryCountRef.current += 1;
                    syncWithCloud();
                }, retryDelay);
            } else {
                console.error('❌ Max retry attempts reached. Please check your connection.');
            }
        }
    }, [entries, settings, otState, lastSyncedHash]);

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

        // Clear any pending retry timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        const timeout = setTimeout(() => {
            syncWithCloud();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [entries, settings, otState, isDataLoaded, syncWithCloud]);

    // Cleanup retry timeout on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    return {
        syncStatus,
        lastSyncError,
        syncWithCloud,
        loadFromCloud
    };
}
