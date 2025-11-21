import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Entry, Settings, OvertimeState, OvertimeEvent } from '../lib/types';
import { computeOvertimeEarned } from '../lib/utils';

interface TimeTrackerContextType {
  entries: Entry[];
  settings: Settings;
  otState: OvertimeState;
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  updateEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  addOvertimeEvent: (event: Omit<OvertimeEvent, 'id'>) => void;
  deleteOvertimeEvent: (id: string) => void;
  importEntries: (newEntries: Omit<Entry, 'id'>[]) => void;
  syncWithCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  logout: () => void;
  login: (data: { entries?: Entry[], settings: Settings, overtime?: OvertimeState }) => void;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

const STORE_KEY = "tt_entries_v2";
const SETTINGS_KEY = "tt_settings_v1";
const OT_STORE_KEY = "tt_overtime_v1";

export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  // Load initial state
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((e: any) => e && typeof e === 'object')
        .map((e: any) => ({
          ...e,
          status: e.status || "work",
          id: e.id || crypto.randomUUID(),
        }));
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return {
        isOnboarded: s.isOnboarded || false,
        weeklyTarget: typeof s.weeklyTarget === "number" ? s.weeklyTarget : 35,
        workDays: typeof s.workDays === "number" ? s.workDays : 5,
        cloudKey: s.cloudKey || "",
        account: s.account || null,
        baseHours: s.baseHours || {
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
    } catch {
      return {
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
    }
  });

  const [otState, setOtState] = useState<OvertimeState>(() => {
    try {
      const o = JSON.parse(localStorage.getItem(OT_STORE_KEY) || "{}");
      return {
        balanceMinutes: o.balanceMinutes || 0,
        earnedMinutes: o.earnedMinutes || 0,
        usedMinutes: o.usedMinutes || 0,
        events: Array.isArray(o.events) ? o.events : [],
      };
    } catch {
      return { balanceMinutes: 0, earnedMinutes: 0, usedMinutes: 0, events: [] };
    }
  });

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(entries));
      // Recalculate overtime whenever entries, settings, or recovery events change
      const earned = computeOvertimeEarned(entries, settings.weeklyTarget, settings.workDays, otState.events);
      setOtState(prev => {
        const newState = {
          ...prev,
          earnedMinutes: earned,
          balanceMinutes: earned - prev.usedMinutes
        };
        localStorage.setItem(OT_STORE_KEY, JSON.stringify(newState));
        return newState;
      });
    } catch (error) {
      console.error("Failed to update overtime state:", error);
    }
  }, [entries, settings.weeklyTarget, settings.workDays, otState.events]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(OT_STORE_KEY, JSON.stringify(otState));
  }, [otState]);

  // Actions
  const addEntry = (entry: Omit<Entry, 'id'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID(), updatedAt: Date.now() };
    setEntries(prev => {
      // Remove existing entry for same date if any
      const filtered = prev.filter(e => e.date !== entry.date);
      return [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const updateEntry = (entry: Entry) => {
    const updatedEntry = { ...entry, updatedAt: Date.now() };
    setEntries(prev => prev.map(e => e.id === entry.id ? updatedEntry : e).sort((a, b) => a.date.localeCompare(b.date)));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

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
    if (!settings.account?.key) return;
    try {
      await fetch(`/api/data?key=${settings.account.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries,
          settings,
          overtime: otState,
        }),
      });
    } catch (error) {
      console.error("Cloud sync failed:", error);
    }
  };

  const loadFromCloud = async () => {
    if (!settings.account?.key) return;
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

  const logout = () => {
    setEntries([]);
    setSettings({
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
    });
    setOtState({ balanceMinutes: 0, earnedMinutes: 0, usedMinutes: 0, events: [] });
    
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(OT_STORE_KEY);
  };

  const login = (data: { entries?: Entry[], settings: Settings, overtime?: OvertimeState }) => {
    if (data.entries) setEntries(data.entries);
    if (data.settings) setSettings(data.settings);
    if (data.overtime) setOtState(data.overtime);
  };

  // Auto-sync when data changes
  useEffect(() => {
    if (settings.account?.key) {
      const timeout = setTimeout(() => {
        syncWithCloud();
      }, 2000); // Debounce 2s
      return () => clearTimeout(timeout);
    }
  }, [entries, settings, otState]);

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
      login
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
