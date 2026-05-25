import mongoose, { Schema } from "mongoose";

const branchSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true
        },
        contact: {
            email: String,
            phone: String
        },
        stockSummary: {
            totalCopies: { type: Number, default: 0 },
            availableCopies: { type: Number, default: 0 },
            issuedCopies: { type: Number, default: 0 },
            damagedCopies: { type: Number, default: 0 }
        }
    },
    {
        timestamps: true
    }
);

export const Branch = mongoose.model("Branch", branchSchema);
