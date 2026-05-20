import { getRedisClient } from "../config/redis.config.js";

/**
 * Get data from cache
 * @param {string} key - Redis key
 * @returns {Promise<any>} Cached data or null
 */
export const getCache = async (key) => {
    try {
        const redisClient = getRedisClient();
        if (!redisClient || !redisClient.isReady) return null;

        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error fetching cache for key ${key}:`, error);
        return null; // Graceful fallback
    }
};

/**
 * Set data in cache
 * @param {string} key - Redis key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default 3600)
 */
export const setCache = async (key, data, ttl = 3600) => {
    try {
        const redisClient = getRedisClient();
        if (!redisClient || !redisClient.isReady) return;

        await redisClient.set(key, JSON.stringify(data), {
            EX: ttl
        });
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
    }
};

/**
 * Delete a specific key from cache
 * @param {string} key - Redis key
 */
export const deleteCache = async (key) => {
    try {
        const redisClient = getRedisClient();
        if (!redisClient || !redisClient.isReady) return;

        await redisClient.del(key);
    } catch (error) {
        console.error(`Error deleting cache for key ${key}:`, error);
    }
};

/**
 * Clear multiple keys matching a pattern
 * @param {string} pattern - Redis key pattern (e.g., "search:books:*")
 */
export const clearCacheByPattern = async (pattern) => {
    try {
        const redisClient = getRedisClient();
        if (!redisClient || !redisClient.isReady) return;

        // Note: In a production cluster, KEYS can be slow. SCAN is preferred.
        // Using SCAN here for better performance
        let cursor = 0;
        do {
            const result = await redisClient.scan(cursor, {
                MATCH: pattern,
                COUNT: 100
            });
            
            cursor = result.cursor;
            const keys = result.keys;
            
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } while (cursor !== 0);
    } catch (error) {
        console.error(`Error clearing cache by pattern ${pattern}:`, error);
    }
};
