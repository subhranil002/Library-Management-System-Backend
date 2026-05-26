import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        isbn13: {
            type: String,
            required: true,
            index: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        reviewText: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        status: {
            type: String,
            enum: ["ACTIVE", "HIDDEN", "FLAGGED", "DELETED"],
            default: "ACTIVE",
            index: true
        },
        editedAt: {
            type: Date,
            default: null
        },
        moderationReason: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate reviews from same user for the same book
reviewSchema.index({ user: 1, isbn13: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
