import mongoose, { Schema } from "mongoose";

const bookCopySchema = new Schema(
    {
        copyId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        isbn13: {
            type: String,
            required: true,
            index: true
        },
        branch: {
            type: Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ["AVAILABLE", "ISSUED", "RESERVED", "LOST", "DAMAGED"],
            default: "AVAILABLE",
            index: true
        },
        rackLocation: {
            type: String,
            default: "UNKNOWN"
        },
        condition: {
            type: String,
            enum: ["NEW", "GOOD", "FAIR", "POOR"],
            default: "GOOD"
        },
        acquisitionDate: {
            type: Date,
            default: Date.now
        },
        barcodeValue: {
            type: String,
            sparse: true
        },
        qrCodeValue: {
            type: String,
            sparse: true
        },
        qrCodeUrl: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate barcodes/qrcodes only if they are not null
bookCopySchema.index({ barcodeValue: 1 }, { unique: true, sparse: true });
bookCopySchema.index({ qrCodeValue: 1 }, { unique: true, sparse: true });

export const BookCopy = mongoose.model("BookCopy", bookCopySchema);
