/**
 * TimeTracker Context - Global State Management
 * 
 * React Context provider that manages:
 * - Time entries (work logs)
 * - User settings (target hours, work days, base schedule)
 * - Overtime state (balance, earned, used minutes, events)
 * - Cloud sync (Vercel + Upstash Redis)
 * - Automatic persistence (hybrid storage: localStorage/IndexedDB)
 * 
 * @module TimeTrackerContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entry, Settings, OvertimeState, OvertimeEvent } from '../lib/types';
import { computeOvertimeEarned } from '../lib/utils';
import { storage } from '../lib/storage';

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
  storageType: "localStorage" | "indexedDB";
  
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
  loadFromCloud: () => Promise<void>;
  login: (data: { entries?: Entry[], settings: Settings, overtime?: OvertimeState }) => void;
  logout: () => void;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

/**
 * Default settings for new users
 * - 35h weekly target (French standard)
 * - 5 working days (Monday-Friday)
 * - Empty base hours (user sets during onboarding)
 */
const defaultSettings: Settings = {
  isOnboarded: false,
  weeklyTarget: 35,
  workDays: 5,
  baseHours: {
    mode: "same",
    same: { start: "", lunchStart: "", lunchEnd: "", end: "" },
    days: {
      mon: { enabled: true, start: "", lunchStart: "", lunchEnd: "", end: "" },
      tue: { enabled: true, start: "", lunchStart: "", lunchEnd: "", end: "" },
      wed: { enabled: true, start: "", lunchStart: "", lunchEnd: "", end: "" },
      thu: { enabled: true, start: "", lunchStart: "", lunchEnd: "", end: "" },
      fri: { enabled: true, start: "", lunchStart: "", lunchEnd: "", end: "" },
      sat: { enabled: false, start: "", lunchStart: "", lunchEnd: "", end: "" },
      sun: { enabled: false, start: "", lunchStart: "", lunchEnd: "", end: "" },
    }
  }
};

/**
 * Default overtime state for new users
 */
const defaultOtState: OvertimeState = { 
  balanceMinutes: 0, 
  earnedMinutes: 0, 
  usedMinutes: 0, 
  events: [] 
};

/**
 * TimeTracker Provider Component
 * Wraps the app to provide state and actions via React Context
 * 
 * Features:
 * - Loads data from storage on mount
 * - Auto-persists changes to storage (useEffect hooks)
 * - Auto-syncs with cloud every 2 seconds (debounced)
 * - Recalculates overtime when entries/settings change
 * - Handles login/logout with data migration
 */
export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [otState, setOtState] = useState<OvertimeState>(defaultOtState);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); // Prevents persist loops during initial load
  const [storageType, setStorageType] = useState<"localStorage" | "indexedDB">("localStorage");

  /**
   * Initial data load from storage on mount
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedEntries, loadedSettings, loadedOtState] = await Promise.all([
          storage.getEntries(),
          storage.getSettings(),
          storage.getOvertimeState()
        ]);

        setEntries(loadedEntries);
        setSettings(loadedSettings || defaultSettings);
        setOtState(loadedOtState || defaultOtState);
        setStorageType(storage.getStorageType());
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load data:", error);
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  /**
   * Persist entries and auto-recalculate overtime
   * Triggers whenever entries or target settings change
   * 
   * Important: One entry per date - new entries replace existing ones
   */
  useEffect(() => {
    if (!isLoaded) return;
    
    const persist = async () => {
      try {
        await storage.importEntries(entries);
        
        // Recalculate earned overtime based on entries + recovery events
        const earned = computeOvertimeEarned(entries, settings.weeklyTarget, settings.workDays, otState.events);
        const newOtState = {
          ...otState,
          earnedMinutes: earned,
          balanceMinutes: earned - otState.usedMinutes
        };
        
        // Only update if values changed (prevents infinite loops)
        if (newOtState.earnedMinutes !== otState.earnedMinutes || 
            newOtState.balanceMinutes !== otState.balanceMinutes) {
          setOtState(newOtState);
          await storage.updateOvertimeState(newOtState);
        }
      } catch (error) {
        console.error("Failed to persist entries:", error);
      }
    };
    persist();
  }, [entries, settings.weeklyTarget, settings.workDays, isLoaded]);

  /**
   * Persist settings changes
   * Also checks for storage type migration (login/logout)
   */
  useEffect(() => {
    if (!isLoaded) return;
    
    const persist = async () => {
      try {
        await storage.updateSettings(settings);
        // Storage may have migrated after login/logout
        const newType = storage.getStorageType();
        if (newType !== storageType) {
          setStorageType(newType);
        }
      } catch (error) {
        console.error("Failed to persist settings:", error);
      }
    };
    persist();
  }, [settings, isLoaded]);

  /**
   * Persist overtime state changes
   */
  useEffect(() => {
    if (!isLoaded) return;
    
    const persist = async () => {
      try {
        await storage.updateOvertimeState(otState);
      } catch (error) {
        console.error("Failed to persist overtime state:", error);
      }
    };
    persist();
  }, [otState, isLoaded]);

  // ========== ACTIONS ==========

  /**
   * Adds a new time entry
   * If entry for same date exists, it will be replaced
   * Auto-generates ID and updatedAt timestamp
   */
  const addEntry = (entry: Omit<Entry, 'id'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID(), updatedAt: Date.now() };
    setEntries(prev => {
      // Remove any existing entry for this date (one entry per date rule)
      const filtered = prev.filter(e => e.date !== entry.date);
      return [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  /**
   * Updates an existing time entry
   * Updates the updatedAt timestamp for sync conflict resolution
   */
  const updateEntry = (entry: Entry) => {
    const updatedEntry = { ...entry, updatedAt: Date.now() };
    setEntries(prev => prev.map(e => e.id === entry.id ? updatedEntry : e).sort((a, b) => a.date.localeCompare(b.date)));
  };

  /**
   * Deletes a time entry by ID
   */
  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  /**
   * Updates user settings (partial update)
   */
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  /**
   * Adds an overtime event (consumption or recovery)
   * - Negative minutes: consumption (reduces balance)
   * - Positive minutes: recovery (adds to earned)
   */
  const addOvertimeEvent = (event: Omit<OvertimeEvent, 'id'>) => {
    const newEvent = { ...event, id: crypto.randomUUID() };
    setOtState(prev => {
      const newUsed = prev.usedMinutes + event.minutes;
      return {
        ...prev,
        usedMinutes: newUsed,
        balanceMinutes: prev.earnedMinutes - newUsed,
        events: [...prev.events, newEvent]
      };
    });
  };

  /**
   * Deletes an overtime event
   * Adjusts usedMinutes and recalculates balance
   */
  const deleteOvertimeEvent = (id: string) => {
    setOtState(prev => {
      const event = prev.events.find(e => e.id === id);
      if (!event) return prev;
      const newUsed = Math.max(0, prev.usedMinutes - event.minutes);
      return {
        ...prev,
        usedMinutes: newUsed,
        balanceMinutes: prev.earnedMinutes - newUsed,
        events: prev.events.filter(e => e.id !== id)
      };
    });
  };

  /**
   * Imports multiple entries (merge strategy: newer updatedAt wins)
   * Used for data import/sync
   */
  const importEntries = (newEntries: Omit<Entry, 'id'>[]) => {
    setEntries(prev => {
      const merged = [...prev];
      newEntries.forEach(entry => {
        const idx = merged.findIndex(e => e.date === entry.date);
        const entryWithId = { 
          ...entry, 
          id: idx > -1 ? merged[idx].id : crypto.randomUUID(),
          updatedAt: Date.now()
        };
        if (idx > -1) {
          merged[idx] = entryWithId as Entry;
        } else {
          merged.push(entryWithId as Entry);
        }
      });
      return merged.sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const syncWithCloud = async () => {
    if (!settings.account?.key || settings.account.isOffline) return;
    setIsSyncing(true);
    setLastSyncError(null);
    try {
      const res = await fetch(`/api/data?key=${settings.account.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries,
          settings,
          overtime: otState,
        }),
      });
      if (!res.ok) {
        throw new Error(`Sync failed: ${res.status}`);
      }
    } catch (error) {
      console.error("Cloud sync failed:", error);
      setLastSyncError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromCloud = async () => {
    if (!settings.account?.key || settings.account.isOffline) return;
    try {
      const res = await fetch(`/api/data?key=${settings.account.key}`);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.entries) setEntries(data.entries);
      if (data.settings) setSettings(data.settings);
      if (data.overtime) setOtState(data.overtime);
    } catch (error) {
      console.error("Cloud load failed:", error);
    }
  };

  const logout = async () => {
    setEntries([]);
    setSettings(defaultSettings);
    setOtState(defaultOtState);
    
    try {
      await storage.clear();
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  };

  const login = (data: { entries?: Entry[], settings: Settings, overtime?: OvertimeState }) => {
    if (data.entries) setEntries(data.entries);
    if (data.settings) setSettings(data.settings);
    if (data.overtime) setOtState(data.overtime);
  };

  // Auto-sync when data changes
  useEffect(() => {
    if (!isLoaded || !settings.account?.key) return;
    
    const timeout = setTimeout(() => {
      syncWithCloud();
    }, 2000); // Debounce 2s
    return () => clearTimeout(timeout);
  }, [entries, settings, otState, isLoaded]);

  return (
    <TimeTrackerContext.Provider value={{
      entries,
      settings,
      otState,
      addEntry,
      updateEntry,
      deleteEntry,
      updateSettings,
      addOvertimeEvent,
      deleteOvertimeEvent,
      importEntries,
      syncWithCloud,
      loadFromCloud,
      logout,
      login,
      isSyncing,
      lastSyncError,
      storageType
    }}>
      {children}
    </TimeTrackerContext.Provider>
  );
}

export function useTimeTracker() {
  const context = useContext(TimeTrackerContext);
  if (context === undefined) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider');
  }
  return context;
}
