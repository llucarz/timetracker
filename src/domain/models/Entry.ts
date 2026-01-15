/**
 * EntryDomain - Domain Model
 * 
 * Operations sur le modèle Entry.
 * Pure functions pour CRUD operations.
 */

import { Entry } from '../../lib/types';

export class EntryDomain {
    /**
     * Crée une nouvelle entry avec ID et timestamp
     */
    static createEntry(data: Omit<Entry, 'id' | 'updatedAt'>): Entry {
        return {
            ...data,
            id: crypto.randomUUID(),
            updatedAt: Date.now()
        };
    }

    /**
     * Met à jour une entry existante (nouveau timestamp)
     */
    static updateEntry(entry: Entry): Entry {
        return {
            ...entry,
            updatedAt: Date.now()
        };
    }

    /**
     * Ajoute ou remplace une entry dans une liste
     * Règle : une seule entry par date
     */
    static upsertEntry(
        entries: Entry[],
        newEntry: Entry
    ): Entry[] {
        const filtered = entries.filter(e => e.date !== newEntry.date);
        return [...filtered, newEntry].sort((a, b) =>
            a.date.localeCompare(b.date)
        );
    }

    /**
     * Supprime une entry par ID
     */
    static removeEntry(entries: Entry[], id: string): Entry[] {
        return entries.filter(e => e.id !== id);
    }

    /**
     * Merge entries (pour import/sync)
     * Newer updatedAt wins
     */
    static mergeEntries(
        existing: Entry[],
        incoming: Omit<Entry, 'id'>[]
    ): Entry[] {
        const merged = [...existing];

        incoming.forEach(entry => {
            const idx = merged.findIndex(e => e.date === entry.date);
            const entryWithId: Entry = {
                ...entry,
                id: idx > -1 ? merged[idx].id : crypto.randomUUID(),
                updatedAt: Date.now()
            };

            if (idx > -1) {
                merged[idx] = entryWithId;
            } else {
                merged.push(entryWithId);
            }
        });

        return merged.sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Merge cloud and local entries intelligently for auto-sync
     * Strategy: Cloud is source of truth, but preserve local-only entries
     * 
     * @param localEntries - Entries from localStorage/IndexedDB
     * @param cloudEntries - Entries from cloud database
     * @returns Merged entries with cloud taking priority
     */
    static mergeCloudAndLocal(
        localEntries: Entry[],
        cloudEntries: Entry[]
    ): Entry[] {
        const merged = new Map<string, Entry>();

        // First, add all local entries
        localEntries.forEach(entry => {
            merged.set(entry.date, entry);
        });

        // Then, merge cloud entries (cloud takes priority)
        cloudEntries.forEach(cloudEntry => {
            const localEntry = merged.get(cloudEntry.date);

            if (!localEntry) {
                // New entry from cloud - add it
                merged.set(cloudEntry.date, cloudEntry);
            } else {
                // Entry exists in both - prefer cloud version (source of truth)
                // But preserve the local ID if it exists
                merged.set(cloudEntry.date, {
                    ...cloudEntry,
                    id: localEntry.id || cloudEntry.id
                });
            }
        });

        // Convert map to array and sort by date
        return Array.from(merged.values()).sort((a, b) =>
            b.date.localeCompare(a.date)
        );
    }
}
