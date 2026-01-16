/**
 * useCloudSync - Production-Grade
 * 
 * Features:
 * - Dirty tracking avec snapshot atomique
 * - Rollback automatique en cas d'erreur
 * - Flush obligatoire (beforeunload + visibilitychange)
 * - Dirty persistence dans localStorage
 * - Conflict detection (409)
 * - Debounce 1s
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Entry, Settings, OvertimeState } from '../lib/types';

interface DirtyState {
    entries: Set<string>;
    settings: boolean;
    overtime: boolean;
}

const DIRTY_STORAGE_KEY = 'tt_dirty_state';
const DEBOUNCE_MS = 1000;

export function useCloudSync(
    entries: Entry[],
    settings: Settings,
    otState: OvertimeState,
    isDataLoaded: boolean
) {
    console.log('[SYNC] useCloudSync mounted'); // 👈 DEBUG LOG
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<string | null>(null);

    // CRITICAL FIX #3: Expose conflict state for UI
    const [conflictState, setConflictState] = useState<{
        hasConflict: boolean;
        serverUpdatedAt: string | null;
    }>({ hasConflict: false, serverUpdatedAt: null });

    // CRITICAL FIX #1: Race condition (stale closure)
    // entries peut être stale quand le debounce fire.
    // On utilise une ref pour toujours avoir la version courante.
    const entriesRef = useRef(entries);
    useEffect(() => {
        entriesRef.current = entries;
    }, [entries]);

    const dirtyRef = useRef<DirtyState>({
        entries: new Set(),
        settings: false,
        overtime: false
    });

    const autoSyncPausedRef = useRef(false);
    const syncTimeoutRef = useRef<NodeJS.Timeout>();
    const lastSyncTimestampRef = useRef<string | null>(null);

    // ========================================
    // 1. RESTORE DIRTY FROM LOCALSTORAGE
    // ========================================
    useEffect(() => {
        try {
            const saved = localStorage.getItem(DIRTY_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                dirtyRef.current = {
                    entries: new Set(parsed.entries || []),
                    settings: parsed.settings || false,
                    overtime: parsed.overtime || false
                };

                if (dirtyRef.current.entries.size > 0 ||
                    dirtyRef.current.settings ||
                    dirtyRef.current.overtime) {
                    setIsSynced(false);
                    console.log('🔄 Restored dirty state from localStorage');
                }
            }
        } catch (error) {
            console.error('Failed to restore dirty state:', error);
        }
    }, []);

    // ========================================
    // 2. PERSIST DIRTY TO LOCALSTORAGE
    // ========================================
    const persistDirty = useCallback(() => {
        try {
            localStorage.setItem(DIRTY_STORAGE_KEY, JSON.stringify({
                entries: Array.from(dirtyRef.current.entries),
                settings: dirtyRef.current.settings,
                overtime: dirtyRef.current.overtime
            }));
        } catch (error) {
            console.error('Failed to persist dirty state:', error);
        }
    }, []);

    // ========================================
    // 7. LOAD FROM CLOUD
    // ========================================
    const loadFromCloud = useCallback(async () => {
        if (!settings.account?.key || settings.account.isOffline) return null;

        try {
            const res = await fetch(`/api/data?key=${settings.account.key}`);
            if (!res.ok) return null;

            const data = await res.json();
            lastSyncTimestampRef.current = data.updatedAt;

            console.log('✅ Cloud data loaded');
            return data;
        } catch (error) {
            console.error('❌ Cloud load failed:', error);
            return null;
        }
    }, [settings.account]);

    // ========================================
    // 3. RESOLVE CONFLICT BY RELOAD
    // ========================================
    const resolveConflictByReload = useCallback(async () => {
        const cloudData = await loadFromCloud();
        if (cloudData) {
            console.log('🔄 Reloaded from cloud after conflict');
            // Clear dirty state
            dirtyRef.current = { entries: new Set(), settings: false, overtime: false };
            localStorage.removeItem(DIRTY_STORAGE_KEY);

            setConflictState({ hasConflict: false, serverUpdatedAt: null });
            setIsSynced(true);

            // UNPAUSE SYNC
            autoSyncPausedRef.current = false;

            return cloudData;
        }
        return null;
    }, [loadFromCloud]);

    // ========================================
    // 4. SYNC WITH SNAPSHOT + ROLLBACK
    // ========================================
    const syncDirtyData = useCallback(async () => {
        // 🔍 DIAGNOSTIC LOG #1: Entry point
        console.log('[SYNC] syncDirtyData start', {
            key: settings?.account?.key,
            offline: settings?.account?.isOffline,
            isSyncing,
            paused: autoSyncPausedRef.current,
            dirty: {
                entries: dirtyRef.current.entries.size,
                settings: dirtyRef.current.settings,
                overtime: dirtyRef.current.overtime,
            }
        });

        // LOCK ANTI-BOUCLE (409)
        if (autoSyncPausedRef.current) {
            console.warn('[SYNC] Abort: Auto-sync is paused due to conflict.');
            return;
        }

        if (isSyncing) {
            console.log('[SYNC] abort: already syncing');
            return;
        }

        if (!settings.account?.key) {
            console.log('[SYNC] abort: no account key');
            return;
        }

        if (settings.account.isOffline) {
            console.log('[SYNC] abort: offline mode');
            return;
        }

        // Snapshot atomique
        const snapshot: DirtyState = {
            entries: new Set(dirtyRef.current.entries),
            settings: dirtyRef.current.settings,
            overtime: dirtyRef.current.overtime
        };

        // 🔍 DIAGNOSTIC LOG #2: Snapshot
        console.log('[SYNC] snapshot taken', {
            entriesCount: snapshot.entries.size,
            settings: snapshot.settings,
            overtime: snapshot.overtime
        });

        // ✅ FIX: Ne pas return si rien n'est dirty - vérifier TOUTES les conditions
        const hasDirtyData = snapshot.entries.size > 0 || snapshot.settings || snapshot.overtime;

        if (!hasDirtyData) {
            console.log('[SYNC] abort: nothing dirty');
            setIsSynced(true);
            return;
        }

        // Clear dirty AVANT sync (nouvelles modifs iront dans nouveau dirty)
        dirtyRef.current = { entries: new Set(), settings: false, overtime: false };
        localStorage.removeItem(DIRTY_STORAGE_KEY);

        setIsSyncing(true);
        setLastSyncError(null);

        try {
            // Préparer payload (seulement dirty data)
            // Préparer payload (seulement dirty data)
            // CRITICAL FIX #2: Read from ref, not closure
            const currentEntries = entriesRef.current;
            const dirtyEntries = currentEntries.filter(e => snapshot.entries.has(e.id));

            // ✅ FIX: Envoyer entries seulement si dirty, sinon undefined
            const payload = {
                entries: snapshot.entries.size > 0 ? dirtyEntries : undefined,
                settings: snapshot.settings ? settings : undefined,
                overtime: snapshot.overtime ? otState : undefined,
                clientUpdatedAt: lastSyncTimestampRef.current
            };

            // 🔍 DIAGNOSTIC LOG #3: Payload avant POST
            console.log("[SYNC] ABOUT TO FETCH", {
                method: "POST",
                url: `/api/data?key=${settings.account.key}`,
                hasEntries: !!payload.entries,
                entriesLen: Array.isArray(payload.entries) ? payload.entries.length : null,
                hasSettings: !!payload.settings,
            });

            const res = await fetch(`/api/data?key=${settings.account.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log("[SYNC] FETCHED", {
                url: res.url,
                status: res.status,
                ok: res.ok
            });

            if (res.status === 409) {
                // BLOCKER #4 FIX: Conflict détecté - expose state & PAUSE
                const { serverUpdatedAt } = await res.json();
                console.warn('⚠️ Conflict detected, server is newer. PAUSING SYNC.');

                setLastSyncError('Conflict: server data is newer');
                setIsSynced(false);
                setConflictState({ hasConflict: true, serverUpdatedAt });

                // CRITICAL: Stop auto-retry loop
                autoSyncPausedRef.current = true;

                // Rollback dirty (keep data safe)
                snapshot.entries.forEach(id => dirtyRef.current.entries.add(id));
                if (snapshot.settings) dirtyRef.current.settings = true;
                if (snapshot.overtime) dirtyRef.current.overtime = true;
                persistDirty();

                return;
            }

            if (!res.ok) {
                throw new Error(`Sync failed: ${res.status}`);
            }

            const { updatedAt } = await res.json();
            lastSyncTimestampRef.current = updatedAt;

            setIsSynced(true);
            setConflictState({ hasConflict: false, serverUpdatedAt: null });
            console.log('✅ Cloud sync successful');
        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            setLastSyncError(error instanceof Error ? error.message : 'Unknown error');
            setIsSynced(false);

            // Rollback dirty
            snapshot.entries.forEach(id => dirtyRef.current.entries.add(id));
            if (snapshot.settings) dirtyRef.current.settings = true;
            if (snapshot.overtime) dirtyRef.current.overtime = true;
            persistDirty();
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, settings, otState, persistDirty]); // entries removed from dependency to avoid recreation spam, ref is used

    // ========================================
    // 4. MARK DIRTY (EXPOSÉ AU CONTEXT)
    // ========================================
    const markDirty = useCallback((type: 'entries' | 'settings' | 'overtime', id?: string) => {
        console.log('[SYNC] markDirty called', { type, id });

        if (type === 'entries' && id) {
            dirtyRef.current.entries.add(id);
        } else {
            dirtyRef.current[type] = true;
        }

        setIsSynced(false);
        persistDirty();

        // Debounce 1s
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            syncDirtyData();
        }, DEBOUNCE_MS);
    }, [persistDirty, syncDirtyData]);

    // ========================================
    // 5. FLUSH AVANT FERMETURE (CRITIQUE)
    // ========================================
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const hasDirty = dirtyRef.current.entries.size > 0 ||
                dirtyRef.current.settings ||
                dirtyRef.current.overtime;

            if (hasDirty && settings.account?.key) {
                e.preventDefault();
                e.returnValue = ''; // Prompt utilisateur

                // CRITICAL FIX #4: Flush avec sendBeacon (best effort)
                const blob = new Blob([JSON.stringify({
                    entries,
                    settings,
                    overtime: otState
                })], { type: 'application/json' });

                const sent = navigator.sendBeacon(
                    `/api/data/flush?key=${settings.account.key}`,
                    blob
                );

                if (sent) {
                    console.log('📤 Flushed data via sendBeacon (best effort)');
                    // NEVER clear dirty here - sendBeacon doesn't guarantee delivery
                    // Dirty will be cleared only after successful syncDirtyData()
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [entries, settings, otState]);

    // ========================================
    // 6. FLUSH SUR VISIBILITYCHANGE (MOBILE)
    // ========================================
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const hasDirty = dirtyRef.current.entries.size > 0 ||
                    dirtyRef.current.settings ||
                    dirtyRef.current.overtime;

                if (hasDirty) {
                    console.log('👁️ Page hidden, triggering sync');
                    syncDirtyData();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [syncDirtyData]);

    return {
        isSyncing,
        isSynced,
        lastSyncError,
        conflictState,
        resolveConflictByReload,
        markDirty,
        syncNow: syncDirtyData,
        loadFromCloud
    };
}
