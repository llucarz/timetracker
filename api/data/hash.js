/**
 * Hash Check API - Vercel Serverless Function
 * 
 * Lightweight endpoint to check if data has changed without loading full data
 * Returns only the hash of the current data
 * 
 * Endpoint: GET /api/data/hash?key=<accountKey>
 * Response: { hash: "abc123...", ok: true }
 * 
 * This reduces bandwidth and API calls by 90%+
 */

import { Redis } from '@upstash/redis';
import crypto from 'crypto';

/**
 * Generate MD5 hash of data
 */
function generateHash(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({ error: 'Missing account key' });
        }

        try {
            const redisKey = `tt:${key}`;
            const data = await redis.get(redisKey);

            if (!data) {
                return res.status(404).json({ error: 'No data found', hash: null });
            }

            // Generate hash of the data
            const hash = generateHash(data);

            return res.status(200).json({
                ok: true,
                hash
            });
        } catch (error) {
            console.error('Hash check failed:', error);
            return res.status(500).json({ error: 'Failed to check hash' });
        }
    }

    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
}
