import { Review, Book } from "../models/index.js";
import { ApiError, ApiResponse, asyncHandler, logAuditEvent } from "../utils/index.js";
import { updateBookRatingAggregates, hasUserBorrowedBook } from "../services/review.service.js";
import { logRecommendationEvent } from "../services/recommendation.service.js";

// Add a new review
export const addReview = asyncHandler(async (req, res, next) => {
    try {
        const { isbn13 } = req.params;
        const { rating, reviewText } = req.body;
        const userId = req.user._id;

        if (!rating || rating < 1 || rating > 5) {
            throw new ApiError("Rating must be between 1 and 5", 400);
        }

        // 1. Verify eligibility
        const hasBorrowed = await hasUserBorrowedBook(userId, isbn13);
        if (!hasBorrowed) {
            throw new ApiError("You can only review books you have borrowed", 403);
        }

        // 2. Check for existing review
        const existingReview = await Review.findOne({ user: userId, isbn13 });
        if (existingReview) {
            throw new ApiError("You have already reviewed this book. You can edit your existing review.", 400);
        }

        // 3. Create review
        const review = await Review.create({
            user: userId,
            isbn13,
            rating,
            reviewText
        });

        // 4. Update Book aggregates
        await updateBookRatingAggregates(isbn13);

        // 5. Log for recommendations
        const book = await Book.findOne({ "industryIdentifiers.isbn13": isbn13 }).lean();
        if (book) {
            logRecommendationEvent({
                userId,
                isbn13,
                actionType: "RATING",
                genre: book.genre,
                author: book.volumeInfo?.author,
                rating
            });
        }

        // 6. Audit Log
        await logAuditEvent(req, {
            actionType: "ADD_REVIEW",
            entityType: "REVIEW",
            entityId: review._id,
            after: { isbn13, rating }
        });

        res.status(201).json(new ApiResponse("Review added successfully", review));
    } catch (error) {
        if (error.code === 11000) {
            next(new ApiError("You have already reviewed this book", 400));
        } else {
            next(new ApiError(`review.controller :: addReview :: ${error.message}`, error.statusCode || 500));
        }
    }
});

// Get reviews for a book
export const getReviews = asyncHandler(async (req, res, next) => {
    try {
        const { isbn13 } = req.params;
        const { page = 1, limit = 10, sort = "recent" } = req.query;

        const query = { isbn13, status: "ACTIVE" };
        const sortOptions = sort === "rating" ? { rating: -1, createdAt: -1 } : { createdAt: -1 };

        const reviews = await Review.find(query)
            .populate("user", "fullName avatar.secure_url")
            .sort(sortOptions)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await Review.countDocuments(query);

        res.status(200).json(new ApiResponse("Reviews fetched successfully", {
            reviews,
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalReviews: total
        }));
    } catch (error) {
        next(new ApiError(`review.controller :: getReviews :: ${error.message}`, error.statusCode || 500));
    }
});

// Update a review
export const updateReview = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, reviewText } = req.body;
        const userId = req.user._id;

        const review = await Review.findById(id);
        if (!review) throw new ApiError("Review not found", 404);

        if (review.user.toString() !== userId.toString()) {
            throw new ApiError("You can only edit your own reviews", 403);
        }

        if (rating) review.rating = rating;
        if (reviewText) review.reviewText = reviewText;
        review.editedAt = new Date();

        await review.save();

        // Update aggregates
        await updateBookRatingAggregates(review.isbn13);

        res.status(200).json(new ApiResponse("Review updated successfully", review));
    } catch (error) {
        next(new ApiError(`review.controller :: updateReview :: ${error.message}`, error.statusCode || 500));
    }
});

// Delete a review (Soft delete for users)
export const deleteReview = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === "ADMIN" || req.user.role === "LIBRARIAN";

        const review = await Review.findById(id);
        if (!review) throw new ApiError("Review not found", 404);

        if (review.user.toString() !== userId.toString() && !isAdmin) {
            throw new ApiError("You can only delete your own reviews", 403);
        }

        review.status = "DELETED";
        await review.save();

        await updateBookRatingAggregates(review.isbn13);

        // Audit Log
        await logAuditEvent(req, {
            actionType: "DELETE_REVIEW",
            entityType: "REVIEW",
            entityId: review._id
        });

        res.status(200).json(new ApiResponse("Review deleted successfully", {}));
    } catch (error) {
        next(new ApiError(`review.controller :: deleteReview :: ${error.message}`, error.statusCode || 500));
    }
});

// Flag/Moderate a review (Admin/Librarian)
export const flagReview = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason, action } = req.body; // action: "FLAG" or "HIDE"

        if (!reason) throw new ApiError("Moderation reason is required", 400);

        const review = await Review.findById(id);
        if (!review) throw new ApiError("Review not found", 404);

        review.status = action === "HIDE" ? "HIDDEN" : "FLAGGED";
        review.moderationReason = reason;
        await review.save();

        // Only update aggregates if we HID it (removed from public view)
        if (action === "HIDE") {
            await updateBookRatingAggregates(review.isbn13);
        }

        // Audit Log
        await logAuditEvent(req, {
            actionType: "MODERATE_REVIEW",
            entityType: "REVIEW",
            entityId: review._id,
            after: { status: review.status, reason }
        });

        res.status(200).json(new ApiResponse(`Review marked as ${review.status}`, review));
    } catch (error) {
        next(new ApiError(`review.controller :: flagReview :: ${error.message}`, error.statusCode || 500));
    }
});
