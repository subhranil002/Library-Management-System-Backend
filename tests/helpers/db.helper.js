// Override DB Name to avoid wiping dev database
process.env.DB_NAME = "BookSphere_Test";
process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import { User, Branch, Book, BookCopy, Reservation, BookTransaction, Payment, Fine, Notification } from "../../src/models/index.js";
import { mockUsers, mockBranches } from "./seed.helper.js";

/**
 * Connect to MongoDB and clear old test collections
 */
export async function setupTestDatabase() {
    if (mongoose.connection.readyState === 0) {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
        await mongoose.connect(mongoUri, {
            dbName: "BookSphere_Test"
        });
    }
    await clearTestDatabase();
    await seedBaseData();
}

/**
 * Clear all collections to ensure repeatable and clean runs
 */
export async function clearTestDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

/**
 * Close database connection
 */
export async function closeTestDatabase() {
    await mongoose.disconnect();
}

/**
 * Seed initial test data like branches and users
 */
async function seedBaseData() {
    // Seed Users
    // Mongoose pre-save hook will automatically hash the passwords
    await User.create(Object.values(mockUsers));

    // Seed Branches
    await Branch.create(mockBranches);
}
