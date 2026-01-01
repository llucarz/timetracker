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
  loadFromCloud: () => Promise<any>;
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
    addEntry: entriesHook.addEntry,
    updateEntry: entriesHook.updateEntry,
    deleteEntry: entriesHook.deleteEntry,
    importEntries: entriesHook.importEntries,

    // Settings
    settings: settingsHook.settings,
    updateSettings: settingsHook.updateSettings,

    // Overtime
    otState: overtimeHook.otState,
    addOvertimeEvent: overtimeHook.addOvertimeEvent,
    deleteOvertimeEvent: handleDeleteOvertimeEvent,

    // Sync
    isSyncing: syncHook.isSyncing,
    lastSyncError: syncHook.lastSyncError,
    syncWithCloud: syncHook.syncWithCloud,
    loadFromCloud: syncHook.loadFromCloud,

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
    syncHook.lastSyncError,
    storageType,
    // Actions (from useCallback, stable)
    entriesHook.addEntry,
    entriesHook.updateEntry,
    entriesHook.deleteEntry,
    entriesHook.importEntries,
    settingsHook.updateSettings,
    overtimeHook.addOvertimeEvent,
    handleDeleteOvertimeEvent,
    syncHook.syncWithCloud,
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
