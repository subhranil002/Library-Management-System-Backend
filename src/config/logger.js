// Centralized Logger config (can be extended with Winston or Morgan in production)
const logger = {
    info: (message, meta = "") => {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta);
    },
    error: (message, error = "") => {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
    },
    warn: (message, meta = "") => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta);
    },
    debug: (message, meta = "") => {
        if (process.env.NODE_ENV === "development") {
            console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta);
        }
    }
};

export default logger;
