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

    const isAllowed = origin && (
        allowedDomains.includes(origin) ||
        origin.endsWith('.vercel.app') // Preview & Production Vercel domains
    );

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

        // Conflict detection
        const meta = await redis.hgetall(metaKey);
        const serverUpdatedAt = meta?.lastSync;
        const clientUpdatedAt = data.updatedAt || data.clientUpdatedAt;

        if (serverUpdatedAt && clientUpdatedAt &&
            new Date(serverUpdatedAt) > new Date(clientUpdatedAt)) {
            // Server is newer - refuse flush silently
            console.warn(`Flush rejected: server newer (${serverUpdatedAt} > ${clientUpdatedAt})`);
            return res.status(204).end();
        }

        // Prepare data
        data.updatedAt = new Date().toISOString();

        // Store JSON brut (pas de compression)
        await redis.set(redisKey, JSON.stringify(data));

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
