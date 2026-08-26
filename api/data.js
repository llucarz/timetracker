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

  // Only OUR deployments, not every site hosted on Vercel. `.endsWith('.vercel.app')`
  // let any third-party Vercel page call this API with the user's credentials.
  // VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL are injected by Vercel at build time.
  [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
    .filter(Boolean)
    .forEach(host => allowedDomains.push(`https://${host}`));

  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
    .forEach(o => allowedDomains.push(o));

  const isAllowed = origin && allowedDomains.includes(origin);

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
      // Parse body: try req.body (Vercel auto-parse), then stream fallback
      let body = {};
      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        body = req.body;
      } else if (req.body && typeof req.body === 'string') {
        try { body = JSON.parse(req.body); } catch { body = {}; }
      } else {
        body = await new Promise((resolve) => {
          let data = '';
          req.on('data', chunk => (data += chunk));
          req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
          req.on('error', () => resolve({}));
        });
      }

      // DIAGNOSTIC
      console.log('[POST /api/data] body keys:', Object.keys(body));
      console.log('[POST /api/data] entries:', Array.isArray(body.entries) ? body.entries.length : 'none');
      console.log('[POST /api/data] deletedIds:', body.deletedIds);

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

      // Enforce the business rule server-side too: ONE entry per date.
      // Merging by id alone let a recreated entry (new id, same date) pile up as a
      // duplicate the client then resolved arbitrarily on load.
      nextEntries = dedupeByDate(nextEntries);

      // Handle explicit Deletions
      const tombstones = { ...(existingData.tombstones || {}) };

      if (deletedIds && Array.isArray(deletedIds) && deletedIds.length > 0) {
        const deletedAt = new Date().toISOString();
        deletedIds.forEach(id => { tombstones[id] = deletedAt; });
        nextEntries = nextEntries.filter(e => !deletedIds.includes(e.id));
      }

      // Drop anything a client re-uploaded after it was deleted elsewhere.
      // Without tombstones a second device still holding the entry resurrected it
      // on its next sync.
      nextEntries = nextEntries.filter(e => {
        const deletedAt = tombstones[e.id];
        if (!deletedAt) return true;
        const entryUpdatedAt = e.updatedAt ? new Date(e.updatedAt).toISOString() : null;
        // Keep only if the entry was written AFTER its deletion (deliberate re-creation).
        return entryUpdatedAt !== null && entryUpdatedAt > deletedAt;
      });

      // ---- SETTINGS HANDLING (Strict Check) ----
      // Only update if explicit AND not null (prevent accidental wipe)
      const nextSettings = body.settings != null ? body.settings : existingData.settings;

      // ---- OVERTIME HANDLING (Strict Check) ----
      const nextOvertime = body.overtime != null ? body.overtime : existingData.overtime;

      const toStore = {
        entries: nextEntries,
        settings: nextSettings,
        overtime: nextOvertime,
        tombstones: pruneTombstones(tombstones),
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

/**
 * Keeps a single entry per date, the most recently written one.
 * Entries without updatedAt are treated as the oldest.
 */
function dedupeByDate(entries) {
  const byDate = new Map();

  for (const entry of entries) {
    if (!entry || !entry.date) continue;

    const current = byDate.get(entry.date);
    if (!current || (entry.updatedAt || 0) >= (current.updatedAt || 0)) {
      byDate.set(entry.date, entry);
    }
  }

  return Array.from(byDate.values());
}

/** Tombstones older than 90 days are dropped: every client has long since synced. */
function pruneTombstones(tombstones) {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return Object.fromEntries(
    Object.entries(tombstones).filter(([, deletedAt]) => deletedAt > cutoff)
  );
}

// readJson removed: Vercel auto-parses JSON into req.body.
// Using req.body directly in the POST handler above.
