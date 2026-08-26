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
     * Ajoute ou remplace une entry dans une liste.
     *
     * Deux règles, pas une :
     * - une seule entry par date
     * - une seule entry par id
     *
     * Filtrer sur la seule date laissait l'ancienne ligne en place quand on
     * déplaçait une entry vers une autre date : on se retrouvait avec deux lignes
     * portant le MÊME id, comptées deux fois dans les totaux.
     */
    static upsertEntry(
        entries: Entry[],
        newEntry: Entry
    ): Entry[] {
        const filtered = entries.filter(
            e => e.date !== newEntry.date && e.id !== newEntry.id
        );
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
     * Merge entries (pour import/sync).
     *
     * Le plus récent gagne, pour de vrai : la version entrante ne remplace la
     * version locale que si son updatedAt est strictement plus récent. Écraser
     * sans comparer faisait qu'une entry cloud plus ANCIENNE effaçait une
     * modification locale pas encore synchronisée — les horaires "changeaient
     * tout seuls" après un rechargement.
     */
    static mergeEntries(
        existing: Entry[],
        incoming: (Omit<Entry, 'id'> & { id?: string })[]
    ): Entry[] {
        const merged = [...existing];

        incoming.forEach(entry => {
            const idx = merged.findIndex(e => e.date === entry.date);
            const current = idx > -1 ? merged[idx] : null;

            const entryWithId: Entry = {
                ...entry,
                // CRITICAL: prefer the incoming (cloud) ID if present.
                // Falling back to local ID or generating a new one only when necessary.
                // ID mismatch between client and server causes deletes/updates to silently fail.
                id: entry.id || current?.id || crypto.randomUUID(),
                updatedAt: entry.updatedAt || Date.now()
            };

            if (!current) {
                merged.push(entryWithId);
                return;
            }

            // Keep whichever version was written last.
            if (entryWithId.updatedAt! >= (current.updatedAt || 0)) {
                merged[idx] = entryWithId;
            }
        });

        return merged.sort((a, b) => a.date.localeCompare(b.date));
    }
}
