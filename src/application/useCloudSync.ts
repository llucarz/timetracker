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
    isDataLoaded: boolean,
    onCloudDataChanged?: (data: any) => void
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

    // Immediate sync on every change (no debounce for real-time experience)
    useEffect(() => {
        if (!isDataLoaded || !settings.account?.key || settings.account.isOffline) return;

        // Clear any pending retry timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        // Sync immediately
        syncWithCloud();
    }, [entries, settings, otState, isDataLoaded, syncWithCloud]);

    // Poll for changes from other devices (every 10 seconds)
    useEffect(() => {
        if (!settings.account?.key || settings.account.isOffline) {
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                console.log('🔍 Polling for changes from other devices...');

                const cloudData = await loadFromCloud();

                if (cloudData && cloudData.entries) {
                    // Calculate hash of cloud data
                    const cloudHash = generateHash({
                        entries: cloudData.entries,
                        settings: cloudData.settings || settings,
                        overtime: cloudData.overtime || otState
                    });

                    // Compare with last synced hash
                    if (cloudHash !== lastSyncedHash && lastSyncedHash !== null) {
                        console.log('🔄 Changes detected from other device!');

                        // Trigger refresh callback
                        if (onCloudDataChanged) {
                            onCloudDataChanged(cloudData);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Polling failed:', error);
                // Don't show error to user, just log it
            }
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(pollInterval);
    }, [settings.account?.key, settings.account?.isOffline, lastSyncedHash, loadFromCloud, onCloudDataChanged, settings, otState]);

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
