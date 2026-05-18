import { createClient } from "redis";
import constants from "../constants.js";

let redisClient;

const connectRedis = async () => {
    try {
        redisClient = createClient({
            url: constants.REDIS_URI || "redis://localhost:6379"
        });

        redisClient.on("error", (err) => console.error("Redis Client Error:", err));
        redisClient.on("ready", () => console.log("Connected to Redis"));

        await redisClient.connect();
    } catch (error) {
        console.error("Failed to connect to Redis: ", error);
        // We do not exit the process because rate limiter has a fallback logic.
        // It should gracefully bypass rate limiting if Redis is unavailable.
    }
};

export const getRedisClient = () => redisClient;
export default connectRedis;
