import { Book, RecommendationEvent } from "../models/index.js";
import { getUserPreferences } from "../helpers/recommendation.helper.js";
import { getCache, setCache } from "../utils/cache.js";

/**
 * Non-blocking event logger for user actions to train the recommendation engine
 */
export const logRecommendationEvent = async ({ userId, isbn13, actionType, genre = [], author, searchTerm, rating }) => {
    try {
        // Fire and forget
        RecommendationEvent.create({
            user: userId,
            isbn13,
            actionType,
            genre,
            author,
            searchTerm,
            rating
        }).catch(err => console.error("Error saving recommendation event:", err));
    } catch (error) {
        console.error("Recommendation Event Logger error:", error);
    }
};

/**
 * Fallback algorithm: Gets the most globally popular books
 */
export const getPopularBooksFallback = async (limit = 10) => {
    const cacheKey = `recommendations:popular`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    // A simple approximation of "Popular": most recent / highly rated
    // Can be replaced with actual borrow counting aggregation later
    const books = await Book.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    const formatted = books.map(b => ({
        ...b,
        relevanceReason: "Popular on BookSphere right now",
        relevanceScore: 0.5
    }));

    await setCache(cacheKey, formatted, 3600 * 24); // Cache for 24h
    return formatted;
};

/**
 * Core engine: Returns personalized book recommendations for a user.
 */
export const getPersonalizedRecommendations = async (userId) => {
    const cacheKey = `recommendations:user:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    // Extract what the user likes based on their history
    const { genres, authors } = await getUserPreferences(userId);

    // If user has no history (Cold Start Problem), return popular items
    if (genres.length === 0 && authors.length === 0) {
        return await getPopularBooksFallback(10);
    }

    // Build matching pipeline
    const pipeline = [
        {
            $match: {
                $or: [
                    { genre: { $in: genres } },
                    { "volumeInfo.author": { $in: authors } }
                ]
            }
        },
        // Randomize the results slightly so the user sees fresh content each day
        { $sample: { size: 15 } },
        {
            $addFields: {
                relevanceScore: {
                    $add: [
                        { $cond: [{ $in: ["$volumeInfo.author", authors] }, 0.5, 0] },
                        { $cond: [{ $gt: [{ $size: { $setIntersection: ["$genre", genres] } }, 0] }, 0.3, 0] },
                        // Add slight boost for new arrivals (published recently or added recently)
                        0.1
                    ]
                },
                relevanceReason: {
                    $cond: [
                        { $in: ["$volumeInfo.author", authors] },
                        "Because you like this author",
                        "Because you like this genre"
                    ]
                }
            }
        },
        { $sort: { relevanceScore: -1 } },
        { $limit: 10 }
    ];

    const recommendedBooks = await Book.aggregate(pipeline);

    // If the pipeline yields too few results, pad it with popular books
    if (recommendedBooks.length < 5) {
        const popular = await getPopularBooksFallback(10 - recommendedBooks.length);
        recommendedBooks.push(...popular);
    }

    // Cache the personalized feed for 2 hours
    await setCache(cacheKey, recommendedBooks, 7200);

    return recommendedBooks;
};
