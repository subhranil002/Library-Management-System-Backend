import { Review, Book, BookTransaction } from "../models/index.js";

/**
 * Recalculate book aggregate review stats directly from the reviews collection
 * @param {string} isbn13 
 */
export const updateBookRatingAggregates = async (isbn13) => {
    try {
        const stats = await Review.aggregate([
            { $match: { isbn13, status: "ACTIVE" } },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: "$rating" },
                    count1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
                    count2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
                    count3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
                    count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
                    count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } }
                }
            }
        ]);

        let updates = {
            "reviewStats.totalReviews": 0,
            "reviewStats.averageRating": 0,
            "reviewStats.ratingDistribution.1": 0,
            "reviewStats.ratingDistribution.2": 0,
            "reviewStats.ratingDistribution.3": 0,
            "reviewStats.ratingDistribution.4": 0,
            "reviewStats.ratingDistribution.5": 0
        };

        if (stats.length > 0) {
            const result = stats[0];
            updates = {
                "reviewStats.totalReviews": result.totalReviews,
                "reviewStats.averageRating": Number(result.averageRating.toFixed(1)),
                "reviewStats.ratingDistribution.1": result.count1,
                "reviewStats.ratingDistribution.2": result.count2,
                "reviewStats.ratingDistribution.3": result.count3,
                "reviewStats.ratingDistribution.4": result.count4,
                "reviewStats.ratingDistribution.5": result.count5
            };
        }

        // Update all book documents that share this isbn13
        await Book.updateMany(
            { "industryIdentifiers.isbn13": isbn13 },
            { $set: updates }
        );
    } catch (error) {
        console.error("Error updating book rating aggregates:", error);
    }
};

/**
 * Verify user has actually borrowed the book
 */
export const hasUserBorrowedBook = async (userId, isbn13) => {
    const transaction = await BookTransaction.findOne({
        "borrowedBy._id": userId.toString(),
        "book.industryIdentifiers.isbn13": isbn13,
        status: { $in: ["PENDING", "FINED", "RETURNED"] }
    });
    return !!transaction;
};
