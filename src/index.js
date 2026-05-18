import app from "./app.js";
import constants from "./constants.js";
import { connectDB, connectCloudinary, connectRedis } from "./config/index.js";

// Connecting to MongoDB
connectDB().then(async () => {
    // Connecting to Redis
    await connectRedis();

    // Connecting to Cloudinary
    connectCloudinary().finally(() => {
        // Starting server
        app.listen(constants.PORT || 3500, async () => {
            console.log(`Server running on port ${constants.PORT}`);
        });
    });
});
