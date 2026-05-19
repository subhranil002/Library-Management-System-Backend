import { getRedisClient } from "../config/redis.config.js";
import { ApiError } from "../utils/index.js";

/**
 * Reusable Rate Limiter Middleware using Redis
 * @param {Object} options Options for the rate limiter
 * @param {number} options.windowMs Time window in milliseconds
 * @param {number} options.maxLimit Maximum number of requests allowed in the time window
 * @param {string} options.message Error message to send when limit is exceeded
 */
const rateLimiter = ({ 
    windowMs = 60 * 1000, 
    maxLimit = 10, 
    message = "Too many requests. Please try again later." 
}) => {
    return async (req, res, next) => {
        try {
            const redisClient = getRedisClient();
            
            // Fallback: If Redis is not connected, gracefully bypass rate limiting
            if (!redisClient || !redisClient.isReady) {
                return next();
            }

            // Identify user by _id if authenticated, otherwise fallback to IP
            const identifier = req.user ? req.user._id.toString() : req.ip;
            // Key based on route path and identifier
            const key = `rate_limit:${req.baseUrl}${req.path}:${identifier}`;

            const currentCount = await redisClient.get(key);

            if (currentCount != null && parseInt(currentCount) >= maxLimit) {
                // Determine TTL to provide accurate retry-after header
                const ttl = await redisClient.ttl(key);
                res.setHeader('Retry-After', ttl);
                return next(new ApiError(message, 429));
            }

            if (currentCount == null) {
                // Set counter to 1 and add expiration in seconds
                await redisClient.set(key, 1, {
                    EX: Math.floor(windowMs / 1000)
                });
            } else {
                // Increment counter
                await redisClient.incr(key);
            }

            next();
        } catch (error) {
            console.error("Rate Limiter Error:", error);
            // If redis fails during check, gracefully allow the request
            next();
        }
    };
};

export default rateLimiter;
