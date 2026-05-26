import { RecommendationEvent } from "../models/index.js";

/**
 * Extracts the top genres and authors from a user's behavior history
 * @param {string} userId 
 * @returns {Promise<{ genres: string[], authors: string[] }>}
 */
export const getUserPreferences = async (userId) => {
    // We heavily weight BORROW and RATING actions over VIEW and SEARCH
    const events = await RecommendationEvent.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: null,
                allGenres: { $push: "$genre" },
                authors: { $push: "$author" }
            }
        }
    ]);

    if (!events.length) {
        return { genres: [], authors: [] };
    }

    // Flatten array of arrays
    const flatGenres = events[0].allGenres.flat().filter(Boolean);
    const validAuthors = events[0].authors.filter(Boolean);

    // Count occurrences
    const genreCounts = flatGenres.reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
    }, {});

    const authorCounts = validAuthors.reduce((acc, author) => {
        acc[author] = (acc[author] || 0) + 1;
        return acc;
    }, {});

    // Sort by most frequent and pick top 3
    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    const topAuthors = Object.entries(authorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    return { genres: topGenres, authors: topAuthors };
};
