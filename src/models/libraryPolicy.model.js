import mongoose, { Schema } from "mongoose";

const libraryPolicySchema = new Schema(
    {
        topic: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        keywords: [
            {
                type: String,
                trim: true,
                lowercase: true
            }
        ],
        content: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const LibraryPolicy = mongoose.model("LibraryPolicy", libraryPolicySchema);
