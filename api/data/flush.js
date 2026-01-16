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

export default async function handler(req, res) {
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
