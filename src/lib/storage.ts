/**
 * Hybrid Storage System - localStorage + IndexedDB
 * 
 * Automatically switches between storage backends based on usage:
 * - GUEST MODE: localStorage (simple, synchronous, max ~5MB)
 * - LOGGED-IN MODE: IndexedDB (async, indexed, unlimited quota)
 * 
 * Migration triggers:
 * 1. Login → localStorage to IndexedDB (if entries > threshold)
 * 2. Logout → IndexedDB to localStorage + clear IndexedDB
 * 3. Entry count > 100 → automatic upgrade to IndexedDB
 * 
 * @module storage
 */

import { Entry, Settings, OvertimeState } from "./types";

/** IndexedDB database name */
const DB_NAME = "TimeTrackerDB";

/** Database schema version (increment when changing structure) */
const DB_VERSION = 1;

/** IndexedDB object store names */
const STORES = {
  ENTRIES: "entries",        // Time entries with date/status indexes
  SETTINGS: "settings",      // Single settings document
  OVERTIME: "overtime",      // Single overtime state document
  STATS_CACHE: "statsCache"  // Performance cache for expensive calculations
};

/** Entry count threshold for auto-migration to IndexedDB */
const INDEXEDDB_THRESHOLD = 100;

/**
 * Storage engine interface - implemented by both LocalStorage and IndexedDB
 */
export interface StorageEngine {
  // Entry operations
  getEntries(): Promise<Entry[]>;
  addEntry(entry: Entry): Promise<void>;
  updateEntry(entry: Entry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  importEntries(entries: Entry[]): Promise<void>;

  // Settings operations
  getSettings(): Promise<Settings | null>;
  updateSettings(settings: Settings): Promise<void>;

  // Overtime operations
  getOvertimeState(): Promise<OvertimeState | null>;
  updateOvertimeState(state: OvertimeState): Promise<void>;

  // Stats cache operations (for performance optimization)
  getStatsCache(key: string): Promise<any>;
  setStatsCache(key: string, value: any): Promise<void>;
  clearStatsCache(): Promise<void>;

  // Utility operations
  clear(): Promise<void>;
  getStorageType(): "localStorage" | "indexedDB";
}

// ============================================================================
// LocalStorage Implementation - Guest Mode
// Simple synchronous storage for small datasets
// ============================================================================

/**
 * LocalStorage backend for guest mode
 * - Stores data in browser localStorage (5-10MB limit)
 * - Synchronous operations (async wrapper for consistency)
 * - No indexes, full scan on queries
 * - Suitable for <100 entries
 */
class LocalStorageEngine implements StorageEngine {
  /** Storage key constants with versioning */
  private readonly KEYS = {
    ENTRIES: "tt_entries_v2",      // v2: Added updatedAt field
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
    // Replaces all existing entries with new set
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
    // Remove all TimeTracker data from localStorage
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  }

  getStorageType(): "localStorage" | "indexedDB" {
    return "localStorage";
  }
}

// ============================================================================
// IndexedDB Implementation - Logged-in Mode
// High-performance indexed database for large datasets
// ============================================================================

/**
 * IndexedDB backend for logged-in mode
 * - Stores data in browser IndexedDB (unlimited quota, subject to user agent)
 * - Asynchronous operations (Promise-based)
 * - Indexed by date, status, updatedAt for fast queries
 * - Suitable for any number of entries (tested with 1000+)
 */
class IndexedDBEngine implements StorageEngine {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initializes IndexedDB connection and creates schema if needed
   * Idempotent: safe to call multiple times
   */
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

      // Schema creation/upgrade
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Entries store with indexes for efficient queries
        if (!db.objectStoreNames.contains(STORES.ENTRIES)) {
          const entriesStore = db.createObjectStore(STORES.ENTRIES, { keyPath: "id" });
          entriesStore.createIndex("date", "date", { unique: false });
          entriesStore.createIndex("status", "status", { unique: false });
          entriesStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        // Settings store (single document with key "settings")
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
        }

        // Overtime store (single document with key "overtime")
        if (!db.objectStoreNames.contains(STORES.OVERTIME)) {
          db.createObjectStore(STORES.OVERTIME);
        }

        // Stats cache store with timestamp index
        if (!db.objectStoreNames.contains(STORES.STATS_CACHE)) {
          const cacheStore = db.createObjectStore(STORES.STATS_CACHE);
          cacheStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Gets an object store for transaction
   * @param storeName - Store to access
   * @param mode - "readonly" or "readwrite"
   */
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

    // Clear existing entries
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Bulk insert new entries
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

    // Clear all stores in sequence
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
// Smart Storage Manager - Automatic Backend Selection
// Transparently switches between localStorage and IndexedDB
// ============================================================================

/**
 * Storage Manager - Intelligent storage backend selector
 * 
 * Automatically chooses and migrates between localStorage and IndexedDB based on:
 * 1. User login status (logged-in → IndexedDB)
 * 2. Entry count (>100 entries → IndexedDB)
 * 
 * Migration is transparent and happens automatically on method calls.
 * All operations are proxied to the active engine.
 */
class StorageManager {
  private engine: StorageEngine;
  private useIndexedDB: boolean = false;

  constructor() {
    // Initial detection on app load
    this.useIndexedDB = this.shouldUseIndexedDB();
    this.engine = this.useIndexedDB ? new IndexedDBEngine() : new LocalStorageEngine();
  }

  /**
   * Determines which storage backend should be used
   * @returns true if IndexedDB should be used, false for localStorage
   */
  private shouldUseIndexedDB(): boolean {
    // Check if user is logged in (account key exists)
    const settingsData = localStorage.getItem("tt_settings_v1");
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      if (settings.account?.key) {
        return true; // Logged in → use IndexedDB
      }
    }

    // Check entry count against threshold
    const entriesData = localStorage.getItem("tt_entries_v2");
    if (entriesData) {
      const entries = JSON.parse(entriesData);
      if (entries.length > INDEXEDDB_THRESHOLD) {
        return true; // Too many entries → use IndexedDB for performance
      }
    }

    return false; // Guest mode with few entries → use localStorage
  }

  /**
   * Migrates data between storage backends if needed
   * Called automatically before operations to ensure correct backend
   */
  async migrateIfNeeded(): Promise<void> {
    const shouldUseIDB = this.shouldUseIndexedDB();

    // Migration: localStorage → IndexedDB
    if (shouldUseIDB && !this.useIndexedDB) {
      // console.log("🔄 Migration: localStorage → IndexedDB");
      const oldEngine = this.engine;
      this.engine = new IndexedDBEngine();
      this.useIndexedDB = true;

      // Copy data from old engine to new engine
      const entries = await oldEngine.getEntries();
      const settings = await oldEngine.getSettings();
      const overtime = await oldEngine.getOvertimeState();

      if (entries.length > 0) await this.engine.importEntries(entries);
      if (settings) await this.engine.updateSettings(settings);
      if (overtime) await this.engine.updateOvertimeState(overtime);

      // console.log("✅ Migration complete: Now using IndexedDB");
    }
    // Migration: IndexedDB → localStorage (logout)
    else if (!shouldUseIDB && this.useIndexedDB) {
      // console.log("🔄 Migration: IndexedDB → localStorage");
      const oldEngine = this.engine;
      this.engine = new LocalStorageEngine();
      this.useIndexedDB = false;

      // Copy data from IndexedDB to localStorage
      const entries = await oldEngine.getEntries();
      const settings = await oldEngine.getSettings();
      const overtime = await oldEngine.getOvertimeState();

      if (entries.length > 0) await this.engine.importEntries(entries);
      if (settings) await this.engine.updateSettings(settings);
      if (overtime) await this.engine.updateOvertimeState(overtime);

      // Clean up IndexedDB after successful migration
      await oldEngine.clear();
      // console.log("✅ Migration complete: Now using localStorage");
    }
  }

  // Proxy all methods to active engine with automatic migration

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
    // Check if we need to migrate after login/logout
    await this.migrateIfNeeded();
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

/**
 * Singleton storage instance
 * Import this to access storage throughout the application
 * 
 * @example
 * import { storage } from '@/lib/storage';
 * const entries = await storage.getEntries();
 */
export const storage = new StorageManager();
