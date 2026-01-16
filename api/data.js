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
  console.log('[SYNC] redisKey =', redisKey);
  console.log('[SYNC] metaKey =', metaKey);

  try {
    if (method === 'GET') {
      const raw = await redis.get(redisKey);

      let entries = [];
      let settings = null;
      let overtime = null;

      if (!raw) {
        console.log('[SYNC] GET: No data found for key', redisKey);
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

      console.log('[SYNC] GET: Returning', entries.length, 'entries');
      return res.status(200).json({ entries, settings, overtime });
    }

    if (method === 'POST') {
      const body = await readJson(req);

      // 🔍 DIAGNOSTIC LOG #2: Verify payload
      console.log('[SYNC] POST: entries in payload =',
        Array.isArray(body.entries) ? body.entries.length : body.entries);
      console.log('[SYNC] POST: deletedIds in payload =',
        Array.isArray(body.deletedIds) ? body.deletedIds.length : body.deletedIds);
      console.log('[SYNC] POST: settings in payload =', body.settings !== undefined);
      console.log('[SYNC] POST: overtime in payload =', body.overtime !== undefined);

      // Conflict detection
      const { clientUpdatedAt, deletedIds } = body;
      const meta = await redis.hgetall(metaKey);
      const serverUpdatedAt = meta?.lastSync;

      if (serverUpdatedAt && clientUpdatedAt &&
        new Date(serverUpdatedAt) > new Date(clientUpdatedAt)) {
        console.log('[SYNC] POST: Conflict detected');
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

      console.log('[SYNC] POST: Existing entries count =', existingData.entries?.length || 0);

      // CRITICAL FIX #1: Merge entries by ID
      let finalEntries = existingData.entries || [];

      if (body.entries !== undefined && Array.isArray(body.entries)) {
        // Index existing entries by ID
        const entriesMap = new Map();
        finalEntries.forEach(e => entriesMap.set(e.id, e));

        // Merge/add new entries
        body.entries.forEach(e => {
          if (e.id) {
            entriesMap.set(e.id, e);
          }
        });

        // Convert back to array
        finalEntries = Array.from(entriesMap.values());
      }

      // CRITICAL FIX #3: Handle deletions
      if (deletedIds && Array.isArray(deletedIds) && deletedIds.length > 0) {
        console.log('[SYNC] POST: Deleting', deletedIds.length, 'entries');
        finalEntries = finalEntries.filter(e => !deletedIds.includes(e.id));
      }

      const toStore = {
        entries: finalEntries,
        settings: body.settings !== undefined ? body.settings : existingData.settings,
        overtime: body.overtime !== undefined ? body.overtime : existingData.overtime,
        updatedAt: new Date().toISOString()
      };

      // 🔍 DIAGNOSTIC LOG #3: Verify what we're writing
      console.log('[SYNC] POST: Writing to Redis key =', redisKey);
      console.log('[SYNC] POST: Final entries count =', toStore.entries.length);
      console.log('[SYNC] POST: Data size =', JSON.stringify(toStore).length, 'bytes');

      // Store JSON brut (pas de compression)
      await redis.set(redisKey, JSON.stringify(toStore));

      // Update metadata
      const currentVersion = parseInt(meta?.version || '0');
      await redis.hset(metaKey, {
        lastSync: toStore.updatedAt,
        version: (currentVersion + 1).toString()
      });

      console.log('[SYNC] POST: ✅ Write successful, version =', currentVersion + 1);

      return res.status(200).json({ ok: true, updatedAt: toStore.updatedAt });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[SYNC] ERROR:', err);
    return res.status(500).json({ error: 'Upstash error', detail: String(err) });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
