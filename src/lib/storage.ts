/**
 * Storage Engine - Hybrid localStorage / IndexedDB
 * 
 * Mode Invité : localStorage (simple, synchrone)
 * Mode Connecté : IndexedDB (performant, indexé)
 */

import { Entry, Settings, OvertimeState } from "./types";

const DB_NAME = "TimeTrackerDB";
const DB_VERSION = 1;
const STORES = {
  ENTRIES: "entries",
  SETTINGS: "settings",
  OVERTIME: "overtime",
  STATS_CACHE: "statsCache"
};

// Seuil pour passer à IndexedDB (nombre d'entrées)
const INDEXEDDB_THRESHOLD = 100;

export interface StorageEngine {
  // Entries
  getEntries(): Promise<Entry[]>;
  addEntry(entry: Entry): Promise<void>;
  updateEntry(entry: Entry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  importEntries(entries: Entry[]): Promise<void>;
  
  // Settings
  getSettings(): Promise<Settings | null>;
  updateSettings(settings: Settings): Promise<void>;
  
  // Overtime
  getOvertimeState(): Promise<OvertimeState | null>;
  updateOvertimeState(state: OvertimeState): Promise<void>;
  
  // Stats Cache
  getStatsCache(key: string): Promise<any>;
  setStatsCache(key: string, value: any): Promise<void>;
  clearStatsCache(): Promise<void>;
  
  // Utils
  clear(): Promise<void>;
  getStorageType(): "localStorage" | "indexedDB";
}

// ============================================================================
// LocalStorage Implementation (Mode Invité)
// ============================================================================

class LocalStorageEngine implements StorageEngine {
  private readonly KEYS = {
    ENTRIES: "tt_entries_v2",
    SETTINGS: "tt_settings_v1",
    OVERTIME: "tt_overtime_v1",
    STATS_CACHE: "tt_stats_cache_v1"
  };

  async getEntries(): Promise<Entry[]> {
    const data = localStorage.getItem(this.KEYS.ENTRIES);
    return data ? JSON.parse(data) : [];
  }

  async addEntry(entry: Entry): Promise<void> {
    const entries = await this.getEntries();
    entries.push(entry);
    localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(entries));
  }

  async updateEntry(entry: Entry): Promise<void> {
    const entries = await this.getEntries();
    const index = entries.findIndex(e => e.id === entry.id);
    if (index !== -1) {
      entries[index] = entry;
      localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(entries));
    }
  }

  async deleteEntry(id: string): Promise<void> {
    const entries = await this.getEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(filtered));
  }

  async importEntries(entries: Entry[]): Promise<void> {
    localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(entries));
  }

  async getSettings(): Promise<Settings | null> {
    const data = localStorage.getItem(this.KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  }

  async updateSettings(settings: Settings): Promise<void> {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  }

  async getOvertimeState(): Promise<OvertimeState | null> {
    const data = localStorage.getItem(this.KEYS.OVERTIME);
    return data ? JSON.parse(data) : null;
  }

  async updateOvertimeState(state: OvertimeState): Promise<void> {
    localStorage.setItem(this.KEYS.OVERTIME, JSON.stringify(state));
  }

  async getStatsCache(key: string): Promise<any> {
    const data = localStorage.getItem(this.KEYS.STATS_CACHE);
    const cache = data ? JSON.parse(data) : {};
    return cache[key];
  }

  async setStatsCache(key: string, value: any): Promise<void> {
    const data = localStorage.getItem(this.KEYS.STATS_CACHE);
    const cache = data ? JSON.parse(data) : {};
    cache[key] = value;
    cache._timestamp = Date.now();
    localStorage.setItem(this.KEYS.STATS_CACHE, JSON.stringify(cache));
  }

  async clearStatsCache(): Promise<void> {
    localStorage.removeItem(this.KEYS.STATS_CACHE);
  }

  async clear(): Promise<void> {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  }

  getStorageType(): "localStorage" | "indexedDB" {
    return "localStorage";
  }
}

// ============================================================================
// IndexedDB Implementation (Mode Connecté)
// ============================================================================

class IndexedDBEngine implements StorageEngine {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store: entries
        if (!db.objectStoreNames.contains(STORES.ENTRIES)) {
          const entriesStore = db.createObjectStore(STORES.ENTRIES, { keyPath: "id" });
          entriesStore.createIndex("date", "date", { unique: false });
          entriesStore.createIndex("status", "status", { unique: false });
          entriesStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        // Store: settings (single document)
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
        }

        // Store: overtime (single document)
        if (!db.objectStoreNames.contains(STORES.OVERTIME)) {
          db.createObjectStore(STORES.OVERTIME);
        }

        // Store: stats cache
        if (!db.objectStoreNames.contains(STORES.STATS_CACHE)) {
          const cacheStore = db.createObjectStore(STORES.STATS_CACHE);
          cacheStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
    await this.init();
    const transaction = this.db!.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async getEntries(): Promise<Entry[]> {
    const store = await this.getStore(STORES.ENTRIES);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async addEntry(entry: Entry): Promise<void> {
    const store = await this.getStore(STORES.ENTRIES, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateEntry(entry: Entry): Promise<void> {
    const store = await this.getStore(STORES.ENTRIES, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEntry(id: string): Promise<void> {
    const store = await this.getStore(STORES.ENTRIES, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async importEntries(entries: Entry[]): Promise<void> {
    const store = await this.getStore(STORES.ENTRIES, "readwrite");
    // Clear existing
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    // Add all new
    for (const entry of entries) {
      await this.addEntry(entry);
    }
  }

  async getSettings(): Promise<Settings | null> {
    const store = await this.getStore(STORES.SETTINGS);
    return new Promise((resolve, reject) => {
      const request = store.get("settings");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSettings(settings: Settings): Promise<void> {
    const store = await this.getStore(STORES.SETTINGS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(settings, "settings");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOvertimeState(): Promise<OvertimeState | null> {
    const store = await this.getStore(STORES.OVERTIME);
    return new Promise((resolve, reject) => {
      const request = store.get("overtime");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateOvertimeState(state: OvertimeState): Promise<void> {
    const store = await this.getStore(STORES.OVERTIME, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(state, "overtime");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStatsCache(key: string): Promise<any> {
    const store = await this.getStore(STORES.STATS_CACHE);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async setStatsCache(key: string, value: any): Promise<void> {
    const store = await this.getStore(STORES.STATS_CACHE, "readwrite");
    return new Promise((resolve, reject) => {
      const data = { ...value, timestamp: Date.now() };
      const request = store.put(data, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStatsCache(): Promise<void> {
    const store = await this.getStore(STORES.STATS_CACHE, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.init();
    const storeNames = [STORES.ENTRIES, STORES.SETTINGS, STORES.OVERTIME, STORES.STATS_CACHE];
    for (const storeName of storeNames) {
      const store = await this.getStore(storeName, "readwrite");
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  getStorageType(): "localStorage" | "indexedDB" {
    return "indexedDB";
  }
}

// ============================================================================
// Smart Storage Manager - Choisit automatiquement le bon engine
// ============================================================================

class StorageManager {
  private engine: StorageEngine;
  private useIndexedDB: boolean = false;

  constructor() {
    // Détection initiale
    this.useIndexedDB = this.shouldUseIndexedDB();
    this.engine = this.useIndexedDB ? new IndexedDBEngine() : new LocalStorageEngine();
  }

  private shouldUseIndexedDB(): boolean {
    // Vérifier si mode connecté
    const settingsData = localStorage.getItem("tt_settings_v1");
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      if (settings.account?.key) {
        return true; // Mode connecté → IndexedDB
      }
    }

    // Vérifier le nombre d'entrées
    const entriesData = localStorage.getItem("tt_entries_v2");
    if (entriesData) {
      const entries = JSON.parse(entriesData);
      if (entries.length > INDEXEDDB_THRESHOLD) {
        return true; // Trop d'entrées → IndexedDB
      }
    }

    return false; // Mode invité avec peu de données → localStorage
  }

  async migrateIfNeeded(): Promise<void> {
    const shouldUseIDB = this.shouldUseIndexedDB();
    
    if (shouldUseIDB && !this.useIndexedDB) {
      // Migrer de localStorage vers IndexedDB
      console.log("🔄 Migration: localStorage → IndexedDB");
      const oldEngine = this.engine;
      this.engine = new IndexedDBEngine();
      this.useIndexedDB = true;

      // Copier les données
      const entries = await oldEngine.getEntries();
      const settings = await oldEngine.getSettings();
      const overtime = await oldEngine.getOvertimeState();

      if (entries.length > 0) await this.engine.importEntries(entries);
      if (settings) await this.engine.updateSettings(settings);
      if (overtime) await this.engine.updateOvertimeState(overtime);

      console.log("✅ Migration terminée");
    } else if (!shouldUseIDB && this.useIndexedDB) {
      // Migrer de IndexedDB vers localStorage (déconnexion)
      console.log("🔄 Migration: IndexedDB → localStorage");
      const oldEngine = this.engine;
      this.engine = new LocalStorageEngine();
      this.useIndexedDB = false;

      // Copier les données
      const entries = await oldEngine.getEntries();
      const settings = await oldEngine.getSettings();
      const overtime = await oldEngine.getOvertimeState();

      if (entries.length > 0) await this.engine.importEntries(entries);
      if (settings) await this.engine.updateSettings(settings);
      if (overtime) await this.engine.updateOvertimeState(overtime);

      // Nettoyer IndexedDB
      await oldEngine.clear();
      console.log("✅ Migration terminée");
    }
  }

  // Proxy toutes les méthodes vers l'engine actif
  async getEntries(): Promise<Entry[]> {
    await this.migrateIfNeeded();
    return this.engine.getEntries();
  }

  async addEntry(entry: Entry): Promise<void> {
    await this.migrateIfNeeded();
    return this.engine.addEntry(entry);
  }

  async updateEntry(entry: Entry): Promise<void> {
    await this.migrateIfNeeded();
    return this.engine.updateEntry(entry);
  }

  async deleteEntry(id: string): Promise<void> {
    await this.migrateIfNeeded();
    return this.engine.deleteEntry(id);
  }

  async importEntries(entries: Entry[]): Promise<void> {
    await this.migrateIfNeeded();
    return this.engine.importEntries(entries);
  }

  async getSettings(): Promise<Settings | null> {
    return this.engine.getSettings();
  }

  async updateSettings(settings: Settings): Promise<void> {
    await this.engine.updateSettings(settings);
    await this.migrateIfNeeded(); // Check si on doit migrer après la connexion
  }

  async getOvertimeState(): Promise<OvertimeState | null> {
    return this.engine.getOvertimeState();
  }

  async updateOvertimeState(state: OvertimeState): Promise<void> {
    return this.engine.updateOvertimeState(state);
  }

  async getStatsCache(key: string): Promise<any> {
    return this.engine.getStatsCache(key);
  }

  async setStatsCache(key: string, value: any): Promise<void> {
    return this.engine.setStatsCache(key, value);
  }

  async clearStatsCache(): Promise<void> {
    return this.engine.clearStatsCache();
  }

  async clear(): Promise<void> {
    return this.engine.clear();
  }

  getStorageType(): "localStorage" | "indexedDB" {
    return this.engine.getStorageType();
  }
}

// Export singleton
export const storage = new StorageManager();
