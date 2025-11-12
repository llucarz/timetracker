// api/data.js — Serverless Function pour Vercel KV
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { method, query } = req;
  const key = (query.key || '').toString().trim();
  if (!key) return res.status(400).json({ error: 'Missing ?key=' });

  const kvKey = `tt:${key}`;

  try {
    if (method === 'GET') {
      const data = await kv.get(kvKey);
      return res.status(200).json({ entries: Array.isArray(data) ? data : [] });
    }

    if (method === 'POST') {
      const body = await readJson(req);
      if (!Array.isArray(body?.entries)) return res.status(400).json({ error: 'entries[] required' });
      await kv.set(kvKey, body.entries);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'KV error' });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
