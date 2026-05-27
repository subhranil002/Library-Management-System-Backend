import mongoose, { Schema } from "mongoose";

const analyticsDailySchema = new Schema(
    {
        date: {
            type: Date,
            required: true,
            index: true
        },
        branchId: {
            type: Schema.Types.ObjectId,
            ref: "Branch",
            index: true,
            default: null // null implies system-wide metric
        },
        metricType: {
            type: String,
            enum: [
                "TOTAL_ISSUES", 
                "TOTAL_RETURNS", 
                "TOTAL_RESERVATIONS", 
                "NEW_USERS", 
                "FINES_COLLECTED",
                "TOP_ISSUED_BOOKS",
                "TOP_RESERVED_BOOKS",
                "TRENDING_GENRES",
                "TRENDING_AUTHORS"
            ],
            required: true,
            index: true
        },
        entityType: {
            type: String, // e.g., 'BOOK', 'GENRE', 'AUTHOR', 'USER', 'SYSTEM'
            required: true
        },
        entityId: {
            type: String, // could be isbn13, genre name, author name, or 'GLOBAL'
            required: true,
            index: true
        },
        count: {
            type: Number,
            default: 0
        },
        value: {
            type: Number, // For things like revenue/fines amount
            default: 0
        },
        metadata: {
            type: Schema.Types.Mixed, // For extra contextual info (like book titles)
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Compound index for fast time-series queries
analyticsDailySchema.index({ date: -1, metricType: 1, branchId: 1 });

export const AnalyticsDaily = mongoose.model("AnalyticsDaily", analyticsDailySchema);
