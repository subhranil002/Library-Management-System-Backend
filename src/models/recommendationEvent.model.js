import mongoose, { Schema } from "mongoose";

const recommendationEventSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        isbn13: {
            type: String,
            index: true
        },
        actionType: {
            type: String,
            enum: ["VIEW", "SEARCH", "BORROW", "RATING", "REVIEW"],
            required: true,
            index: true
        },
        genre: {
            type: [String],
            default: []
        },
        author: {
            type: String,
            trim: true
        },
        searchTerm: {
            type: String,
            trim: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        source: {
            type: String,
            default: "SYSTEM"
        }
    },
    {
        timestamps: true
    }
);

// TTL index: keep events for 1 year to stay relevant but not bloat the database
recommendationEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const RecommendationEvent = mongoose.model(
    "RecommendationEvent",
    recommendationEventSchema
);
