/**
 * Cloud Sync API - PRODUCTION FINAL
 * 
 * CRITICAL FIXES:
 * - #1: Merge entries by ID (no data loss)
 * - #2: NO compression (JSON brut partout pour simplicité)
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { method, query } = req;
  const key = (query.key || '').toString().trim();

  if (!key) {
    return res.status(400).json({ error: 'Missing ?key= parameter' });
  }

  const redisKey = `tt:${key}`;
  const metaKey = `tt:${key}:meta`;

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

      return res.status(200).json({ entries, settings, overtime });
    }

    if (method === 'POST') {
      const body = await readJson(req);

      // Conflict detection
      const { clientUpdatedAt } = body;
      const meta = await redis.hgetall(metaKey);
      const serverUpdatedAt = meta?.lastSync;

      if (serverUpdatedAt && clientUpdatedAt &&
        new Date(serverUpdatedAt) > new Date(clientUpdatedAt)) {
        return res.status(409).json({
          error: 'Conflict detected',
          serverUpdatedAt
        });
      }

      // CRITICAL FIX #1: Merge entries by ID
      const existing = await redis.get(redisKey);
      let existingData = { entries: [], settings: null, overtime: null };

      if (existing) {
        if (typeof existing === 'string') {
          existingData = JSON.parse(existing);
        } else if (typeof existing === 'object') {
          existingData = existing;
        }
      }

      // Merge logic
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

      const toStore = {
        entries: finalEntries,
        settings: body.settings !== undefined ? body.settings : existingData.settings,
        overtime: body.overtime !== undefined ? body.overtime : existingData.overtime,
        updatedAt: new Date().toISOString()
      };

      // Store JSON brut (pas de compression)
      await redis.set(redisKey, JSON.stringify(toStore));

      // Update metadata
      const currentVersion = parseInt(meta?.version || '0');
      await redis.hset(metaKey, {
        lastSync: toStore.updatedAt,
        version: (currentVersion + 1).toString()
      });

      return res.status(200).json({ ok: true, updatedAt: toStore.updatedAt });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('Upstash error:', err);
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
