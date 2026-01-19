/**
 * useCloudSync - Production-Grade (State Machine v2 - Strict)
 * 
 * Features:
 * - Robust State Machine (Boot vs Cloud)
 * - Dirty tracking avec snapshot atomique
 * - Rollback automatique en cas d'erreur
 * - Conflict detection (409)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Entry, Settings, OvertimeState, SyncStatus } from '../lib/types';

interface DirtyState {
    entries: Set<string>;
    deletedIds: Set<string>;
    settings: boolean;
    overtime: boolean;
}

type BootState = 'idle' | 'loading' | 'ready' | 'error';
type CloudState = 'idle' | 'syncing' | 'conflict' | 'error';

const DIRTY_STORAGE_KEY = 'tt_dirty_state';
const DEBOUNCE_MS = 1000;

export function useCloudSync(
    entries: Entry[],
    settings: Settings,
    otState: OvertimeState,
    isDataLoaded: boolean
) {
    console.log('[SYNC] useCloudSync mounted');

    // 1. STRICT INTERNAL STATE MACHINE
    const [bootState, setBootState] = useState<BootState>('idle');
    const [cloudState, setCloudState] = useState<CloudState>('idle');

    // Error tracking
    const [lastError, setLastError] = useState<string | null>(null);
    const [conflictServerDate, setConflictServerDate] = useState<string | null>(null);

    // REFS
    const entriesRef = useRef(entries);
    useEffect(() => { entriesRef.current = entries; }, [entries]);

    const dirtyRef = useRef<DirtyState>({
        entries: new Set(),
        deletedIds: new Set(),
        settings: false,
        overtime: false
    });

    const autoSyncPausedRef = useRef(false);
    const syncTimeoutRef = useRef<NodeJS.Timeout>();
    const lastSyncTimestampRef = useRef<string | null>(null);

    // GUARD: Boot tracking
    const bootKeyRef = useRef<string | null>(null);

    // 2. COMPUTED PUBLIC STATUS (Zero Ambiguity)
    const syncStatus: SyncStatus = useMemo(() => {
        // Priority 1: Network
        if (settings.account?.isOffline) return 'offline';

        // Priority 2: Conflict (Blocking)
        if (cloudState === 'conflict') return 'conflict';

        // Priority 3: Boot Sequence
        if (bootState === 'idle' || bootState === 'loading') return 'initializing';
        if (bootState === 'error') return 'error';

        // Priority 4: Cloud Operations
        if (cloudState === 'syncing') return 'syncing';
        if (cloudState === 'error') return 'error';

        // Priority 5: Default Success
        return 'synced';
    }, [settings.account?.isOffline, cloudState, bootState]);

    // Derived flags for compat/UI
    const isSyncing = cloudState === 'syncing'; // Legacy support if needed
    const hasConflict = cloudState === 'conflict';

    // ========================================
    // DIRTY RESTORE/PERSIST
    // ========================================
    useEffect(() => {
        try {
            const saved = localStorage.getItem(DIRTY_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                dirtyRef.current = {
                    entries: new Set(parsed.entries || []),
                    deletedIds: new Set(parsed.deletedIds || []),
                    settings: parsed.settings || false,
                    overtime: parsed.overtime || false
                };
            }
        } catch (error) {
            console.error('Failed to restore dirty state:', error);
        }
    }, []);

    const persistDirty = useCallback(() => {
        try {
            localStorage.setItem(DIRTY_STORAGE_KEY, JSON.stringify({
                entries: Array.from(dirtyRef.current.entries),
                deletedIds: Array.from(dirtyRef.current.deletedIds),
                settings: dirtyRef.current.settings,
                overtime: dirtyRef.current.overtime
            }));
        } catch (error) {
            console.error('Failed to persist dirty state:', error);
        }
    }, []);

    // ========================================
    // BOOT SEQUENCE (GET)
    // ========================================
    const loadFromCloud = useCallback(async () => {
        if (!settings.account?.key || settings.account.isOffline) {
            setBootState('ready'); // Local or Offline -> Ready
            return null;
        }

        try {
            const res = await fetch(`/api/data?key=${settings.account.key}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                console.warn(`[BOOT] Load failed ${res.status}`);
                setBootState('error');
                setLastError(`Erreur chargement (${res.status})`);
                return null;
            }

            const data = await res.json();
            lastSyncTimestampRef.current = data.updatedAt;

            console.log('✅ BOOT SUCCESS');
            setBootState('ready');
            setCloudState('idle'); // Ensure clean slate
            setLastError(null);
            return data;
        } catch (error) {
            console.error('❌ BOOT FAILED:', error);
            setBootState('error');
            setLastError(error instanceof Error ? error.message : 'Erreur inconnue');
            return null;
        }
    }, [settings.account]);

    // BOOT TRIGGER logic (Corrected: Single Source of Truth)
    useEffect(() => {
        const key = settings.account?.key || null;
        const isOffline = !!settings.account?.isOffline;

        // 1. If Offline -> Ready (no boot needed)
        if (isOffline) {
            setBootState('ready');
            return;
        }

        // 2. If No Key -> Ready (Local Mode)
        if (!key) {
            setBootState('ready');
            return;
        }

        // 3. Guard: Prevent redundant boots, but ALLOW retries (idle/error)
        // We skip ONLY if we are already loading or successfully ready with the SAME key.
        if (bootKeyRef.current === key && (bootState === 'loading' || bootState === 'ready')) {
            return;
        }

        // 4. Trigger Boot
        console.log('[BOOT] Triggering for key:', key);
        bootKeyRef.current = key;
        setBootState('loading');
        setCloudState('idle');
        setLastError(null);

        loadFromCloud().catch(() => {
            // Safety catch, though loadFromCloud handles its own errors
            setBootState('error');
        });

    }, [settings.account?.key, settings.account?.isOffline, loadFromCloud, bootState]);


    // ========================================
    // CLOUD SYNC (POST)
    // ========================================
    const syncDirtyData = useCallback(async () => {
        // STRICT GUARDS
        if (autoSyncPausedRef.current) return;
        if (cloudState === 'syncing') return;
        if (bootState !== 'ready') return; // Cannot sync if not booted
        if (!settings.account?.key || settings.account.isOffline) return;

        // CHECK DIRTY
        const snapshot: DirtyState = {
            entries: new Set(dirtyRef.current.entries),
            deletedIds: new Set(dirtyRef.current.deletedIds),
            settings: dirtyRef.current.settings,
            overtime: dirtyRef.current.overtime
        };

        const hasDirtyData = snapshot.entries.size > 0 || snapshot.deletedIds.size > 0 || snapshot.settings || snapshot.overtime;
        if (!hasDirtyData) {
            if (cloudState !== 'idle') setCloudState('idle');
            return;
        }

        // PREPARE
        dirtyRef.current = { entries: new Set(), deletedIds: new Set(), settings: false, overtime: false };
        localStorage.removeItem(DIRTY_STORAGE_KEY);

        setCloudState('syncing'); // ENTER SYNC
        setLastError(null);

        try {
            const payload = {
                entries: snapshot.entries.size > 0 ? entriesRef.current.filter(e => snapshot.entries.has(e.id)) : undefined,
                deletedIds: snapshot.deletedIds.size > 0 ? Array.from(snapshot.deletedIds) : undefined,
                settings: snapshot.settings ? settings : undefined,
                overtime: snapshot.overtime ? otState : undefined,
                clientUpdatedAt: lastSyncTimestampRef.current
            };

            const res = await fetch(`/api/data?key=${settings.account.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Important for Safari
                body: JSON.stringify(payload)
            });

            if (res.status === 409) {
                // 409 CONFLICT
                const { serverUpdatedAt } = await res.json();
                console.warn('⚠️ 409 CONFLICT');

                setCloudState('conflict');
                setConflictServerDate(serverUpdatedAt);
                setLastError('Conflit détecté');
                autoSyncPausedRef.current = true; // PAUSE AUTO-SYNC

                // Rollback dirty
                snapshot.entries.forEach(id => dirtyRef.current.entries.add(id));
                snapshot.deletedIds.forEach(id => dirtyRef.current.deletedIds.add(id));
                if (snapshot.settings) dirtyRef.current.settings = true;
                if (snapshot.overtime) dirtyRef.current.overtime = true;
                persistDirty();
                return;
            }

            if (!res.ok) throw new Error(`Sync failed: ${res.status}`);

            const { updatedAt } = await res.json();
            lastSyncTimestampRef.current = updatedAt;

            console.log('✅ SYNC SUCCESS');
            setCloudState('idle'); // BACK TO IDLE

        } catch (error) {
            console.error('❌ SYNC ERROR:', error);
            setCloudState('error');
            setLastError(error instanceof Error ? error.message : 'Erreur inconnue');

            // Rollback
            snapshot.entries.forEach(id => dirtyRef.current.entries.add(id));
            snapshot.deletedIds.forEach(id => dirtyRef.current.deletedIds.add(id));
            if (snapshot.settings) dirtyRef.current.settings = true;
            if (snapshot.overtime) dirtyRef.current.overtime = true;
            persistDirty();
        }
    }, [cloudState, bootState, settings, otState, persistDirty]);

    // ========================================
    // CONFLICT RESOLUTION
    // ========================================
    const resolveConflictByReload = useCallback(async () => {
        // Force Reload
        const cloudData = await loadFromCloud(); // Will set BootState='loading' then 'ready'

        if (cloudData) {
            // Strict Reset as requested
            setBootState('ready');
            setCloudState('idle');
            autoSyncPausedRef.current = false;
            setConflictServerDate(null);

            // Clear dirty
            dirtyRef.current = { entries: new Set(), deletedIds: new Set(), settings: false, overtime: false };
            localStorage.removeItem(DIRTY_STORAGE_KEY);

            return cloudData;
        }
        return null;
    }, [loadFromCloud]);

    // ========================================
    // MARK DIRTY
    // ========================================
    const markDirty = useCallback((type: 'entries' | 'settings' | 'overtime', id?: string) => {
        if (type === 'entries' && id) {
            // Si on ré-ajoute/modifie, on s'assure qu'il n'est plus marqué "deleted"
            dirtyRef.current.entries.add(id);
            dirtyRef.current.deletedIds.delete(id);
        } else if (type === 'settings' || type === 'overtime') {
            dirtyRef.current[type] = true;
        }
        persistDirty();

        // Debounce
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            syncDirtyData();
        }, DEBOUNCE_MS);
    }, [persistDirty, syncDirtyData]);

    const markDeleted = useCallback((id: string) => {
        dirtyRef.current.entries.delete(id);
        dirtyRef.current.deletedIds.add(id);
        persistDirty();

        // Instant Sync for Delete
        clearTimeout(syncTimeoutRef.current);
        syncDirtyData();
    }, [persistDirty, syncDirtyData]);

    // ========================================
    // FLUSH
    // ========================================
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const hasDirty = dirtyRef.current.entries.size > 0 ||
                dirtyRef.current.deletedIds.size > 0 ||
                dirtyRef.current.settings ||
                dirtyRef.current.overtime;

            if (hasDirty && settings.account?.key && !settings.account.isOffline) {
                e.preventDefault();
                e.returnValue = '';

                navigator.sendBeacon(
                    `/api/data/flush?key=${settings.account.key}`,
                    new Blob([JSON.stringify({ entries, settings, overtime: otState })], { type: 'application/json' })
                );
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [entries, settings, otState]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') syncDirtyData();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [syncDirtyData]);

    // IMPORT
    // IMPORT (BULK UPSERT)
    // --------------------------------------------------------
    const syncImported = useCallback(async (importedEntries: Entry[]) => {
        const key = settings.account?.key;
        if (!key || settings.account?.isOffline) return;

        console.log(`[IMPORT] Starting bulk sync for ${importedEntries.length} entries`);

        try {
            // 1. Prepare Payload
            // Ensure all entries have IDs (Context should have handled this, but safety first)
            const validEntries = importedEntries.filter(e => e.id);

            const payload = {
                mode: 'bulkUpsert',
                entries: validEntries,
                deletedIds: [], // Import doesn't delete
                clientUpdatedAt: new Date().toISOString()
            };

            console.log(`[IMPORT] Sending payload with ${validEntries.length} entries`);

            // 2. Send (Bypass Debounce/Queue)
            setCloudState('syncing');
            const res = await fetch(`/api/data?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!res.ok) {
                if (res.status === 409) {
                    setCloudState('conflict');
                    setLastError('Conflit durant l\'import');
                    return;
                }
                throw new Error(`Import failed ${res.status}`);
            }

            const data = await res.json();
            console.log(`[IMPORT] Success. Written: ${data.entriesWritten}`);

            // 3. Cleanup
            lastSyncTimestampRef.current = data.updatedAt;
            setCloudState('idle');
            setLastError(null);

            // Mark these as clean since we just synced them
            validEntries.forEach(e => dirtyRef.current.entries.delete(e.id));
            persistDirty();

        } catch (error) {
            console.error('[IMPORT] Error:', error);
            setCloudState('error');
            setLastError('Erreur sauvegard import');
        }
    }, [settings.account]);

    const performLogout = useCallback(() => {
        console.log('[SYNC] performLogout: Cleaning state');
        autoSyncPausedRef.current = true;
        clearTimeout(syncTimeoutRef.current);

        dirtyRef.current = { entries: new Set(), deletedIds: new Set(), settings: false, overtime: false };
        localStorage.removeItem(DIRTY_STORAGE_KEY);

        setCloudState('idle');
        setConflictServerDate(null);
        setBootState('idle');
        setLastError(null);
        bootKeyRef.current = null; // Re-arm boot trigger for next login
    }, []);

    return {
        syncStatus, // Computes strict status
        isSyncing: cloudState === 'syncing', // Compat
        isSynced: syncStatus === 'synced', // Compat helper
        lastSyncError: lastError,
        conflictState: { hasConflict: cloudState === 'conflict', serverUpdatedAt: conflictServerDate },
        resolveConflictByReload,
        markDirty,
        markDeleted,
        syncNow: syncDirtyData,
        loadFromCloud,
        syncImported,
        performLogout
    };
}
