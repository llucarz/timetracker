/**
 * useEntries - Application Hook
 * 
 * Gère le state et la persistence des entries.
 * Utilise EntryDomain pour la business logic.
 */

import { useState, useEffect, useCallback } from 'react';
import { Entry } from '../lib/types';
import { storage } from '../lib/storage';
import { EntryDomain } from '../domain';

export function useEntries() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const loaded = await storage.getEntries();
                setEntries(loaded);
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load entries:', error);
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    // Persist to storage when entries change
    useEffect(() => {
        if (!isLoaded) return;

        const persist = async () => {
            try {
                await storage.importEntries(entries);
            } catch (error) {
                console.error('Failed to persist entries:', error);
            }
        };
        persist();
    }, [entries, isLoaded]);

    const addEntry = useCallback((entry: Omit<Entry, 'id'>) => {
        const newEntry = EntryDomain.createEntry(entry);
        setEntries(prev => EntryDomain.upsertEntry(prev, newEntry));
    }, []);

    const updateEntry = useCallback((entry: Entry) => {
        const updated = EntryDomain.updateEntry(entry);
        setEntries(prev => EntryDomain.upsertEntry(prev, updated));
    }, []);

    const deleteEntry = useCallback((id: string) => {
        setEntries(prev => EntryDomain.removeEntry(prev, id));
    }, []);

    const importEntries = useCallback((newEntries: Omit<Entry, 'id'>[]) => {
        setEntries(prev => EntryDomain.mergeEntries(prev, newEntries));
    }, []);

    return {
        entries,
        isLoaded,
        addEntry,
        updateEntry,
        deleteEntry,
        importEntries
    };
}
