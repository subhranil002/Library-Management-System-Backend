import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: [
                "OVERDUE_REMINDER",
                "FINE_ALERT",
                "RESERVATION_AVAILABLE",
                "NEW_ARRIVAL",
                "DUE_DATE_REMINDER",
                "RENEWAL_APPROVED",
                "RENEWAL_DENIED",
                "GENERAL_INFO"
            ],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["PENDING", "SENT", "FAILED", "READ"],
            default: "PENDING",
            index: true
        },
        sentAt: {
            type: Date,
            default: null
        },
        readAt: {
            type: Date,
            default: null
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

export const Notification = mongoose.model("Notification", notificationSchema);
