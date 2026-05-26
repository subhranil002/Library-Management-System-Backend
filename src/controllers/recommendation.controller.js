import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { 
    getPersonalizedRecommendations, 
    getPopularBooksFallback, 
    logRecommendationEvent 
} from "../services/recommendation.service.js";
import { Book } from "../models/index.js";

// Get recommendations for the logged-in user
export const getMyRecommendations = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        const recommendations = await getPersonalizedRecommendations(userId);

        res.status(200).json(new ApiResponse("Recommendations fetched successfully", recommendations));
    } catch (error) {
        next(new ApiError(`recommendation.controller :: getMyRecommendations :: ${error.message}`, error.statusCode || 500));
    }
});

// Get popular books fallback
export const getPopularRecommendations = asyncHandler(async (req, res, next) => {
    try {
        const recommendations = await getPopularBooksFallback(10);
        res.status(200).json(new ApiResponse("Popular recommendations fetched", recommendations));
    } catch (error) {
        next(new ApiError(`recommendation.controller :: getPopularRecommendations :: ${error.message}`, error.statusCode || 500));
    }
});

// Explicitly log an event from the client (e.g. tracking a "VIEW" or "CLICK")
export const logEvent = asyncHandler(async (req, res, next) => {
    try {
        const { isbn13, actionType, rating, searchTerm } = req.body;
        const userId = req.user._id;

        if (!actionType) throw new ApiError("actionType is required", 400);

        // Optional: lookup genre/author if a book was interacted with
        let genre = [];
        let author = null;

        if (isbn13) {
            const book = await Book.findOne({ "industryIdentifiers.isbn13": isbn13 }).lean();
            if (book) {
                genre = book.genre;
                author = book.volumeInfo?.author;
            }
        }

        await logRecommendationEvent({
            userId,
            isbn13,
            actionType,
            genre,
            author,
            rating,
            searchTerm
        });

        res.status(200).json(new ApiResponse("Recommendation event logged", {}));
    } catch (error) {
        next(new ApiError(`recommendation.controller :: logEvent :: ${error.message}`, error.statusCode || 500));
    }
});

// Get recommendations strictly by genre (useful for browse pages)
export const getRecommendationsByGenre = asyncHandler(async (req, res, next) => {
    try {
        const { genre } = req.params;
        
        const books = await Book.find({ genre: { $regex: new RegExp(`^${genre}$`, "i") } })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.status(200).json(new ApiResponse("Genre recommendations fetched", books));
    } catch (error) {
        next(new ApiError(`recommendation.controller :: getRecommendationsByGenre :: ${error.message}`, error.statusCode || 500));
    }
});
