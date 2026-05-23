import mongoose, { Schema } from "mongoose";

const reservationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        isbn13: {
            type: String,
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ["WAITING", "AVAILABLE", "COLLECTED", "EXPIRED", "CANCELLED"],
            default: "WAITING",
            index: true
        },
        queuePosition: {
            type: Number,
            default: null
        },
        expiresAt: {
            type: Date,
            default: null
        },
        notifiedAt: {
            type: Date,
            default: null
        },
        pickedUpAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate active reservations for the same user and book
reservationSchema.index(
    { user: 1, isbn13: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["WAITING", "AVAILABLE"] }
        }
    }
);

export const Reservation = mongoose.model("Reservation", reservationSchema);
