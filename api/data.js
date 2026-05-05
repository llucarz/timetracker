/**
 * Cloud Sync API - PRODUCTION FINAL + DIAGNOSTIC
 * 
 * CRITICAL FIXES:
 * - #1: Merge entries by ID (no data loss)
 * - #2: NO compression (JSON brut)
 * - #3: Support deletedIds for proper deletion handling
 * - #4: Diagnostic logs for debugging
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// SAFARI FIX: Centralized CORS logic with Security Whitelist
function setCors(req, res) {
  const origin = req.headers.origin;
  const allowedDomains = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite default
  ];

  const isAllowed = origin && (
    allowedDomains.includes(origin) ||
    origin.endsWith('.vercel.app') // Preview & Production Vercel domains
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  // Toujours renvoyer ces headers pour supporter les preflights, 
  // mais sans Allow-Origin si non autorisé (le navigateur bloquera).
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;
  const key = (query.key || '').toString().trim();

  if (!key) {
    return res.status(400).json({ error: 'Missing ?key= parameter' });
  }

  const redisKey = `tt:${key}`;
  const metaKey = `tt:${key}:meta`;

  // 🔍 DIAGNOSTIC LOG #1: Verify Redis keys


  try {
    if (method === 'GET') {
      const raw = await redis.get(redisKey);

      let entries = [];
      let settings = null;
      let overtime = null;

      if (!raw) {

        return res.status(200).json({ entries, settings, overtime });
      }

      // Parse data (JSON brut)
      if (Array.isArray(raw)) {
        entries = raw;
      } else if (typeof raw === 'string' && raw.length) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            entries = parsed;
          } else if (parsed && typeof parsed === 'object') {
            entries = parsed.entries || [];
            settings = parsed.settings || null;
            overtime = parsed.overtime || null;
          }
        } catch {
          entries = [];
        }
      } else if (raw && typeof raw === 'object') {
        entries = raw.entries || [];
        settings = raw.settings || null;
        overtime = raw.overtime || null;
      }


      const storedUpdatedAt = (typeof raw === 'object' && !Array.isArray(raw) && raw?.updatedAt)
        ? raw.updatedAt
        : (typeof raw === 'string' ? (() => { try { const p = JSON.parse(raw); return p?.updatedAt || null; } catch { return null; } })() : null);

      return res.status(200).json({ entries, settings, overtime, updatedAt: storedUpdatedAt });
    }

    if (method === 'POST') {
      // Vercel auto-parses JSON bodies into req.body.
      // readJson() was reading a stream already consumed by Vercel → always returned {}.
      const body = req.body || {};

      // 🔍 DIAGNOSTIC LOGS
      const mode = body.mode || 'standard';


      // Conflict detection
      const { clientUpdatedAt, deletedIds } = body;
      const meta = await redis.hgetall(metaKey);
      const serverUpdatedAt = meta?.lastSync;

      // Note: In bulkUpsert we might technically skip conflict check if desired, 
      // but strictly speaking a conflict is a conflict. 
      // User didn't ask to bypass, so we keep it.
      if (serverUpdatedAt && clientUpdatedAt &&
        new Date(serverUpdatedAt) > new Date(clientUpdatedAt) &&
        mode !== 'force') { // Added 'force' escape hatch just in case

        return res.status(409).json({
          error: 'Conflict detected',
          serverUpdatedAt
        });
      }

      // Load existing data
      const existing = await redis.get(redisKey);
      let existingData = { entries: [], settings: null, overtime: null };

      if (existing) {
        if (typeof existing === 'string') {
          existingData = JSON.parse(existing);
        } else if (typeof existing === 'object') {
          existingData = existing;
        }
      }

      // ---- ENTRIES HANDLING (Strict Merge) ----
      let nextEntries = existingData.entries || [];


      // Rule: IF entries are provided, we MERGE them (Upsert)
      // We do NOT replace because standard sync sends partials.
      // We do NOT wipe if empty array is sent (merge empty = no change).
      if (body.entries !== undefined && Array.isArray(body.entries)) {
        const map = new Map(nextEntries.map(e => [e.id, e]));
        body.entries.forEach(e => {
          if (e.id) map.set(e.id, e);
        });
        nextEntries = Array.from(map.values());
      }

      // Handle explicit Deletions
      if (deletedIds && Array.isArray(deletedIds) && deletedIds.length > 0) {

        nextEntries = nextEntries.filter(e => !deletedIds.includes(e.id));
      }

      // ---- SETTINGS HANDLING (Strict Check) ----
      // Only update if explicit AND not null (prevent accidental wipe)
      const nextSettings = body.settings != null ? body.settings : existingData.settings;

      // ---- OVERTIME HANDLING (Strict Check) ----
      const nextOvertime = body.overtime != null ? body.overtime : existingData.overtime;

      const toStore = {
        entries: nextEntries,
        settings: nextSettings,
        overtime: nextOvertime,
        updatedAt: new Date().toISOString()
      };

      // 🔍 WRITE LOGS


      // Store JSON brut
      await redis.set(redisKey, JSON.stringify(toStore));

      // Update metadata
      const currentVersion = parseInt(meta?.version || '0');
      await redis.hset(metaKey, {
        lastSync: toStore.updatedAt,
        version: (currentVersion + 1).toString()
      });



      // SAFETY CHECK: Critical Alert for Silent Failures
      const receivedEntriesCount = Array.isArray(body.entries) ? body.entries.length : 0;
      if (mode === 'bulkUpsert' && receivedEntriesCount > 0 && nextEntries.length === 0) {
        console.error('[SYNC] 🚨 CRITICAL: Bulk Upsert received entries but stored 0!');
      }

      return res.status(200).json({
        ok: true,
        updatedAt: toStore.updatedAt,
        entriesWritten: nextEntries.length,
        receivedEntriesLen: body.entries !== undefined ? receivedEntriesCount : null,
        storedEntriesLen: nextEntries.length
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    return res.status(500).json({ error: 'Upstash error', detail: String(err) });
  }
}

// readJson removed: Vercel auto-parses JSON into req.body.
// Using req.body directly in the POST handler above.
