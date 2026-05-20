import { getCache } from "../utils/cache.js";
import { ApiResponse } from "../utils/index.js";

/**
 * Caching Middleware
 * Automatically intercepts requests, checks Redis cache, and returns early if hit.
 * If cache miss, it proceeds to the controller.
 * 
 * @param {Function} keyGenerator - Function that returns the cache key for this request
 */
export const cacheMiddleware = (keyGenerator) => {
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);
            
            // Check cache
            const cachedData = await getCache(key);
            
            if (cachedData) {
                return res.status(200).json(
                    new ApiResponse("Data fetched from cache successfully", cachedData)
                );
            }
            
            // Inject key into req for the controller to use when setting cache
            req.cacheKey = key;
            next();
        } catch (error) {
            console.error("Cache Middleware Error:", error);
            // On error, bypass cache and hit DB
            next();
        }
    };
};
