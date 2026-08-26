/**
 * Flush endpoint - PRODUCTION FINAL
 * 
 * CRITICAL FIXES:
 * - #2: JSON brut (no compression)
 * - Conflict detection
 * - Proper version increment
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

    // Only OUR deployments - see api/data.js for the rationale.
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

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { key } = req.query;

    if (!key) {
        return res.status(400).end();
    }

    try {
        const data = req.body;
        const redisKey = `tt:${key}`;
        const metaKey = `tt:${key}:meta`;

        // Conflict detection.
        //
        // This endpoint overwrites the WHOLE record, so an unverifiable flush is
        // refused rather than allowed through: a client that cannot prove which
        // server version it is based on must not be able to clobber newer data.
        const meta = await redis.hgetall(metaKey);
        const serverUpdatedAt = meta?.lastSync;
        const clientUpdatedAt = data.clientUpdatedAt || data.updatedAt;

        if (serverUpdatedAt && !clientUpdatedAt) {
            console.warn(`Flush rejected: no clientUpdatedAt supplied for ${key}`);
            return res.status(204).end();
        }

        if (serverUpdatedAt && clientUpdatedAt &&
            new Date(serverUpdatedAt) > new Date(clientUpdatedAt)) {
            // Server is newer - refuse flush silently
            console.warn(`Flush rejected: server newer (${serverUpdatedAt} > ${clientUpdatedAt})`);
            return res.status(204).end();
        }

        // Prepare data (clientUpdatedAt is a request field, not stored state)
        const { clientUpdatedAt: _ignored, ...toStore } = data;
        toStore.updatedAt = new Date().toISOString();
        data.updatedAt = toStore.updatedAt;

        // Store JSON brut (pas de compression)
        await redis.set(redisKey, JSON.stringify(toStore));

        // Proper version increment
        const currentVersion = parseInt(meta?.version || '0');
        await redis.hset(metaKey, {
            lastSync: data.updatedAt,
            version: (currentVersion + 1).toString()
        });

        console.log(`✅ Flush successful for ${key}, version ${currentVersion + 1}`);

        // 204 No Content
        return res.status(204).end();
    } catch (error) {
        console.error('Flush error:', error);
        return res.status(500).end();
    }
}
