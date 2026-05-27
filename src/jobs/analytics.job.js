import cron from "node-cron";
import { 
    BookTransaction, 
    Reservation, 
    User, 
    Fine, 
    RecommendationEvent,
    AnalyticsDaily
} from "../models/index.js";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * Generates and stores daily analytics aggregations.
 * This should run shortly after midnight.
 */
export const runDailyAnalyticsAggregation = async (targetDate = new Date()) => {
    try {
        console.log(`Starting daily analytics aggregation for ${targetDate.toISOString()}`);
        
        // We aggregate data for the specific target date
        const start = startOfDay(targetDate);
        const end = endOfDay(targetDate);

        // Delete any existing aggregates for this exact date to allow safe re-runs
        await AnalyticsDaily.deleteMany({ date: start });

        // 1. Total Issues
        const issues = await BookTransaction.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: null, count: { $sum: 1 } } }
        ]);
        const issuesCount = issues[0]?.count || 0;
        await AnalyticsDaily.create({
            date: start,
            metricType: "TOTAL_ISSUES",
            entityType: "SYSTEM",
            entityId: "GLOBAL",
            count: issuesCount
        });

        // 2. Total Returns
        const returns = await BookTransaction.aggregate([
            { $match: { returnDate: { $gte: start, $lte: end }, status: "RETURNED" } },
            { $group: { _id: null, count: { $sum: 1 } } }
        ]);
        const returnsCount = returns[0]?.count || 0;
        await AnalyticsDaily.create({
            date: start,
            metricType: "TOTAL_RETURNS",
            entityType: "SYSTEM",
            entityId: "GLOBAL",
            count: returnsCount
        });

        // 3. New Users
        const users = await User.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: null, count: { $sum: 1 } } }
        ]);
        const usersCount = users[0]?.count || 0;
        await AnalyticsDaily.create({
            date: start,
            metricType: "NEW_USERS",
            entityType: "SYSTEM",
            entityId: "GLOBAL",
            count: usersCount
        });

        // 4. Top Issued Books (Granular)
        const topBooks = await BookTransaction.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: "$book.industryIdentifiers.isbn13",
                    count: { $sum: 1 },
                    title: { $first: "$book.volumeInfo.title" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 50 }
        ]);

        for (const book of topBooks) {
            await AnalyticsDaily.create({
                date: start,
                metricType: "TOP_ISSUED_BOOKS",
                entityType: "BOOK",
                entityId: book._id,
                count: book.count,
                metadata: { title: book.title }
            });
        }

        // 5. Trending Genres & Authors (From RecommendationEvents telemetry)
        const topGenres = await RecommendationEvent.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, genre: { $exists: true, $ne: [] } } },
            { $unwind: "$genre" },
            { $group: { _id: "$genre", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        for (const genre of topGenres) {
            await AnalyticsDaily.create({
                date: start,
                metricType: "TRENDING_GENRES",
                entityType: "GENRE",
                entityId: genre._id,
                count: genre.count
            });
        }

        console.log(`Daily analytics aggregation completed successfully for ${start.toISOString()}`);
    } catch (error) {
        console.error("Error in daily analytics aggregation job:", error);
    }
};

/**
 * Initializes the Cron Job to run at 00:05 AM every day
 * We calculate stats for "yesterday"
 */
export const initAnalyticsJobs = () => {
    cron.schedule("5 0 * * *", () => {
        const yesterday = subDays(new Date(), 1);
        runDailyAnalyticsAggregation(yesterday);
    });
    console.log("Analytics cron job initialized.");
};
