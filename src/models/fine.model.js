import mongoose from "mongoose";

const fineSchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        },
        borrower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        fineAmount: {
            type: Number,
            required: [true, "Fine amount is required"],
            trim: true
        },
        fineReason: {
            type: String,
            required: [true, "Fine reason is required"],
            trim: true,
            maxlength: [50, "Fine reason must be less than 50 characters"]
        },
    },
    {
        timestamps: true
    }            
);

export const Fine = mongoose.model("Fine", fineSchema);