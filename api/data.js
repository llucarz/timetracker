// api/data.js — Vercel Serverless Function (Node) + Vercel KV (Upstash Redis)
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const { method, query } = req;
    const key = (query.key || '').toString().trim();
    if (!key) return res.status(400).json({ error: 'Missing ?key=' });

    const kvKey = `tt:${key}`;

    if (method === 'GET') {
      const data = await kv.get(kvKey);
      // data est soit un tableau (nos entrées), soit null
      const entries = Array.isArray(data) ? data : [];
      return res.status(200).json({ entries });
    }

    if (method === 'POST') {
      const body = await readJson(req);       // << pas req.json()
      if (!Array.isArray(body?.entries)) {
        return res.status(400).json({ error: 'entries[] required' });
      }
      await kv.set(kvKey, body.entries);      // on stocke juste le tableau
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('KV API error:', e);
    return res.status(500).json({ error: e?.message || 'KV error' });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
