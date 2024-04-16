import mongoose from "mongoose";

const bookTransactionSchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        },
        borrowedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        returnDate: {
            type: Date,
            required: [true, "Return date is required"],
            trim: true
        },
    },
    {
        timestamps: true
    }
);

export const BookTransaction = mongoose.model(
    "BookTransaction",
    bookTransactionSchema
);
