import mongoose from "mongoose";

const bookTransactionSchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        },
        bookCode: {
            type: String,
            trim: true,
            required: [true, "Book code is required"],
            maxlength: [10, "Book code must be less than 10 characters"]
        },
        borrowedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        returnDate: {
            type: Date,
            required: [true, "Return date is required"],
            trim: true
        },
        status: {
            type: String,
            enum: ["pending", "returned"],
            default: "pending",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const BookTransaction = mongoose.model(
    "BookTransaction",
    bookTransactionSchema
);
