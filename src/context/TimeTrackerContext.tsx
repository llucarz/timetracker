/**
 * TimeTracker Context - Refactored (FIXED)
 * 
 * Lightweight orchestrator using application hooks.
 * Reduced from 404 lines → ~130 lines.
 * 
 * Business logic moved to:
 * - domain/ (pure logic)
 * - application/ (hooks)
 * 
 * FIX: useMemo on context value to prevent unnecessary re-renders
 */

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { Entry, Settings, OvertimeState, OvertimeEvent } from '../lib/types';
import { storage } from '../lib/storage';
import { useEntries, useSettings, useOvertime, useCloudSync } from '../application';

/**
 * Context value type - exposes state and actions to consumers
 */
interface TimeTrackerContextType {
  // State
  entries: Entry[];
  settings: Settings;
  otState: OvertimeState;
  isSyncing: boolean;
  isSynced: boolean;
  lastSyncError: string | null;
  storageType: 'localStorage' | 'indexedDB';

  // Entry actions
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  updateEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  importEntries: (newEntries: Omit<Entry, 'id'>[]) => void;

  // Settings actions
  updateSettings: (newSettings: Partial<Settings>) => void;

  // Overtime actions
  addOvertimeEvent: (event: Omit<OvertimeEvent, 'id'>) => void;
  deleteOvertimeEvent: (id: string) => void;

  // Cloud sync actions
  syncWithCloud: () => Promise<void>;
  syncNow: () => Promise<void>;
  loadFromCloud: () => Promise<any>;
  markDirty: (type: 'entries' | 'settings' | 'overtime', id?: string) => void;
  conflictState: { hasConflict: boolean; serverUpdatedAt: string | null };
  resolveConflictByReload: () => Promise<any>;
  login: (data: { entries?: Entry[], settings: Settings, overtime?: OvertimeState }) => void;
  logout: () => void;
  clearData: () => Promise<void>;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

/**
 * TimeTracker Provider - Refactored with useMemo fix
 * 
 * Orchestrates application hooks:
 * - useEntries: Entry CRUD + persistence
 * - useSettings: Settings management + persistence
 * - useOvertime: Overtime state + auto-recalculation
 * - useCloudSync: Cloud synchronization
 * 
 * All business logic is now in domain/application layers.
 */
export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  // Use application hooks
  const entriesHook = useEntries();
  const settingsHook = useSettings();

  const overtimeHook = useOvertime(
    entriesHook.entries,
    settingsHook.settings,
    entriesHook.isLoaded,
    settingsHook.isLoaded
  );

  const syncHook = useCloudSync(
    entriesHook.entries,
    settingsHook.settings,
    overtimeHook.otState,
    entriesHook.isLoaded && settingsHook.isLoaded && overtimeHook.isLoaded
  );

  // Wrapped actions with dirty tracking (debounce 1s + flush)
  const addEntry = useCallback((entry: Omit<Entry, 'id'>) => {
    const newEntry = entriesHook.addEntry(entry);
    // Mark entry as dirty (will trigger debounced sync)
    if (newEntry && newEntry.id) {
      syncHook.markDirty('entries', newEntry.id);
    }
  }, [entriesHook, syncHook]);

  const updateEntry = useCallback((entry: Entry) => {
    entriesHook.updateEntry(entry);
    syncHook.markDirty('entries', entry.id);
  }, [entriesHook, syncHook]);

  const deleteEntry = useCallback((id: string) => {
    entriesHook.deleteEntry(id);
    syncHook.markDirty('entries', id);
  }, [entriesHook, syncHook]);

  const importEntries = useCallback((newEntries: Omit<Entry, 'id'>[]) => {
    const imported = entriesHook.importEntries(newEntries);
    // Mark all imported entries as dirty
    if (imported && Array.isArray(imported)) {
      imported.forEach((entry: Entry) => {
        if (entry.id) syncHook.markDirty('entries', entry.id);
      });
    }
    // Force immediate sync after import
    syncHook.syncNow();
  }, [entriesHook, syncHook]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    settingsHook.updateSettings(updates);
    syncHook.markDirty('settings');
  }, [settingsHook, syncHook]);

  const addOvertimeEvent = useCallback((event: Omit<OvertimeEvent, 'id'>) => {
    overtimeHook.addOvertimeEvent(event);
    syncHook.markDirty('overtime');
  }, [overtimeHook, syncHook]);

  // Auth actions
  const logout = useCallback(async () => {
    try {
      await storage.clear();
      window.location.reload(); // Simple reset
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  const login = useCallback((data: {
    entries?: Entry[],
    settings: Settings,
    overtime?: OvertimeState
  }) => {
    if (data.entries) {
      entriesHook.importEntries(data.entries);
    }
    if (data.settings) {
      settingsHook.updateSettings(data.settings);
    }
    // Note: overtime will auto-recalculate via useOvertime hook
  }, [entriesHook, settingsHook]);

  const storageType = storage.getStorageType();

  /**
   * Wrapped deleteOvertimeEvent
   * When deleting a recovery event (negative minutes), also delete the corresponding Entry.
   */
  const handleDeleteOvertimeEvent = useCallback((id: string) => {
    // 1. Find the event
    const event = overtimeHook.otState.events.find(e => e.id === id);

    if (event) {
      // 2. If it's a recovery (consumption), check for corresponding entry
      if (event.minutes < 0) {
        const recoveryEntry = entriesHook.entries.find(e =>
          e.date === event.date && e.status === 'recovery'
        );

        if (recoveryEntry) {
          console.log(`Deleting corresponding recovery entry: ${recoveryEntry.id} for date ${event.date}`);
          entriesHook.deleteEntry(recoveryEntry.id);
        }
      }
    }

    // 3. Delete the overtime event
    overtimeHook.deleteOvertimeEvent(id);
  }, [overtimeHook.otState.events, overtimeHook.deleteOvertimeEvent, entriesHook.entries, entriesHook.deleteEntry]);

  // CRITICAL FIX: Memoize context value to prevent unnecessary re-renders
  // This ensures that consumer components don't re-render unless data actually changes
  const contextValue = useMemo(() => ({
    // Entries
    entries: entriesHook.entries,
    addEntry,
    updateEntry,
    deleteEntry,
    importEntries,

    // Settings
    settings: settingsHook.settings,
    updateSettings,

    // Overtime
    otState: overtimeHook.otState,
    addOvertimeEvent,
    deleteOvertimeEvent: handleDeleteOvertimeEvent,

    // Sync
    isSyncing: syncHook.isSyncing,
    isSynced: syncHook.isSynced,
    lastSyncError: syncHook.lastSyncError,
    syncWithCloud: syncHook.syncNow, // Use syncNow as syncWithCloud
    syncNow: syncHook.syncNow,
    loadFromCloud: syncHook.loadFromCloud,
    markDirty: syncHook.markDirty,
    conflictState: syncHook.conflictState,
    resolveConflictByReload: syncHook.resolveConflictByReload,

    // Auth
    login,
    logout,
    clearData: logout, // Reuse logout logic (clear storage + reload)
    storageType
  }), [
    // State
    entriesHook.entries,
    settingsHook.settings,
    overtimeHook.otState,
    syncHook.isSyncing,
    syncHook.isSynced,
    syncHook.lastSyncError,
    storageType,
    // Actions (from useCallback, stable)
    addEntry,
    updateEntry,
    deleteEntry,
    importEntries,
    updateSettings,
    addOvertimeEvent,
    handleDeleteOvertimeEvent,
    syncHook.syncWithCloud,
    syncHook.syncNow,
    syncHook.loadFromCloud,
    logout,
    login
  ]);

  return (
    <TimeTrackerContext.Provider value={contextValue}>
      {children}
    </TimeTrackerContext.Provider>
  );
}

/**
 * Hook to access TimeTracker context
 */
export function useTimeTracker() {
  const context = useContext(TimeTrackerContext);
  if (context === undefined) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider');
  }
  return context;
}
