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
    onCloudDataChanged?: (data: any) => void,
    isPersisting?: boolean  // Track if local persistence is in progress
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
    // BUT wait for local persistence to complete first
    useEffect(() => {
        if (!isDataLoaded || !settings.account?.key || settings.account.isOffline) return;

        // Don't sync if local persistence is still in progress
        if (isPersisting) return;

        // Clear any pending retry timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        // Sync immediately after local persistence is done
        syncWithCloud();
    }, [entries, settings, otState, isDataLoaded, isPersisting, syncWithCloud]);

    // Track user activity for adaptive polling
    const lastActivityRef = useRef<number>(Date.now());
    const [pollingInterval, setPollingInterval] = useState(10000); // Start with 10s

    // Update last activity time when data changes
    useEffect(() => {
        lastActivityRef.current = Date.now();
    }, [entries, settings, otState]);

    // Adaptive polling: adjust frequency based on activity
    useEffect(() => {
        const updatePollingInterval = () => {
            const timeSinceActivity = Date.now() - lastActivityRef.current;

            if (timeSinceActivity < 5 * 60 * 1000) {
                // Active (< 5 min): poll every 10 seconds
                setPollingInterval(10000);
            } else if (timeSinceActivity < 30 * 60 * 1000) {
                // Idle (5-30 min): poll every 30 seconds
                setPollingInterval(30000);
            } else {
                // Very idle (> 30 min): poll every 60 seconds
                setPollingInterval(60000);
            }
        };

        // Check every minute to adjust polling interval
        const adjustInterval = setInterval(updatePollingInterval, 60000);
        updatePollingInterval(); // Initial check

        return () => clearInterval(adjustInterval);
    }, []);

    // Poll for changes from other devices (adaptive frequency + HEAD endpoint)
    useEffect(() => {
        if (!settings.account?.key || settings.account.isOffline) {
            return;
        }

        const pollForChanges = async () => {
            try {
                console.log(`🔍 Polling for changes (interval: ${pollingInterval / 1000}s)...`);

                // First, check hash only (lightweight request)
                const hashRes = await fetch(`/api/data/hash?key=${settings.account.key}`);

                if (!hashRes.ok) {
                    console.error('Hash check failed:', hashRes.status);
                    return;
                }

                const { hash: cloudHash } = await hashRes.json();

                // Compare with last synced hash
                if (cloudHash && cloudHash !== lastSyncedHash && lastSyncedHash !== null) {
                    console.log('🔄 Changes detected from other device! Loading full data...');

                    // Only load full data if hash changed
                    const cloudData = await loadFromCloud();

                    if (cloudData && onCloudDataChanged) {
                        onCloudDataChanged(cloudData);
                    }
                } else {
                    console.log('✅ No changes detected (hash match)');
                }
            } catch (error) {
                console.error('❌ Polling failed:', error);
                // Don't show error to user, just log it
            }
        };

        // Initial poll
        pollForChanges();

        // Set up interval with adaptive frequency
        const pollIntervalId = setInterval(pollForChanges, pollingInterval);

        return () => clearInterval(pollIntervalId);
    }, [settings.account?.key, settings.account?.isOffline, lastSyncedHash, loadFromCloud, onCloudDataChanged, pollingInterval]);

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
