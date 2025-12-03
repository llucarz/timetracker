/**
 * Cloud Sync API - Vercel Serverless Function
 * 
 * Backend for TimeTracker cloud sync via Upstash Redis
 * 
 * Endpoints:
 * - GET  /api/data?key=<accountKey> - Load user data
 * - POST /api/data?key=<accountKey> - Save user data
 * 
 * Data format:
 * - Key: tt:<accountKey> (e.g., tt:acct:company-name:user-name)
 * - Value: JSON object with { entries, settings, overtime }
 * 
 * Legacy format migration:
 * - Old: Array of entries only
 * - New: Object with entries, settings, overtime
 * 
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
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

  const redisKey = `tt:${key}`; // Redis key format: tt:<accountKey>

  try {
    if (method === 'GET') {
      const raw = await redis.get(redisKey);

      // Valeurs par défaut
      let entries  = [];
      let settings = null;
      let overtime = null;

      if (!raw) {
        // rien en BDD → on renvoie les valeurs par défaut
        return res.status(200).json({ entries, settings, overtime });
      }

      if (Array.isArray(raw)) {
        // 🧓 Ancien format : on stockait juste un tableau d'entries
        entries = raw;
      } else if (typeof raw === 'string' && raw.length) {
        try {
          const parsed = JSON.parse(raw);

          // Si c’est encore un tableau => ancien format
          if (Array.isArray(parsed)) {
            entries = parsed;
          } else if (parsed && typeof parsed === 'object') {
            // Nouveau format complet
            if (Array.isArray(parsed.entries)) entries = parsed.entries;
            if (parsed.settings && typeof parsed.settings === 'object') {
              settings = parsed.settings;
            }
            if (parsed.overtime && typeof parsed.overtime === 'object') {
              overtime = parsed.overtime;
            }
          }
        } catch {
          // JSON cassé → on renvoie des valeurs vides
          entries  = [];
          settings = null;
          overtime = null;
        }
      } else if (raw && typeof raw === 'object') {
        // Cas où Upstash renverrait déjà un objet
        if (Array.isArray(raw.entries)) entries = raw.entries;
        if (raw.settings && typeof raw.settings === 'object') {
          settings = raw.settings;
        }
        if (raw.overtime && typeof raw.overtime === 'object') {
          overtime = raw.overtime;
        }
      }

      return res.status(200).json({ entries, settings, overtime });
    }

    if (method === 'POST') {
      const body = await readJson(req);

      // body attendu : { entries, settings, overtime }
      if (!Array.isArray(body?.entries)) {
        return res
          .status(400)
          .json({ error: 'Body must be { entries: [...], settings?, overtime? }' });
      }

      const toStore = {
        entries: body.entries,
        settings: body.settings || null,
        overtime: body.overtime || null,
      };

      await redis.set(redisKey, JSON.stringify(toStore));
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('Upstash error:', err);
    return res.status(500).json({ error: 'Upstash error', detail: String(err) });
  }
}

/**
 * Helper to read and parse JSON from request body
 * Node.js serverless function doesn't auto-parse body
 */
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
