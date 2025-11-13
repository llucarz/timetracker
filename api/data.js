// api/data.js — API Vercel + Upstash Redis (REST)

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { method, query } = req;
  const key = (query.key || '').toString().trim();

  if (!key) {
    return res.status(400).json({ error: 'Missing ?key=' });
  }

  const redisKey = `tt:${key}`; // clé logique pour ton time tracker

  try {
    if (method === 'GET') {
      const raw = await redis.get(redisKey);

      // raw peut être null, une string JSON, ou déjà un tableau
      let entries = [];
      if (Array.isArray(raw)) entries = raw;
      else if (typeof raw === 'string' && raw.length) {
        try { entries = JSON.parse(raw); } catch { entries = []; }
      }

      return res.status(200).json({ entries });
    }

    if (method === 'POST') {
      const body = await readJson(req);

      if (!Array.isArray(body?.entries)) {
        return res.status(400).json({ error: 'Body must be { entries: [...] }' });
      }

      // on stocke en JSON
      await redis.set(redisKey, JSON.stringify(body.entries));
      return res.status(200).json({ ok: true });
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
