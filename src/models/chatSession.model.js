import mongoose, { Schema } from "mongoose";

const chatSessionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        title: {
            type: String,
            default: "New Conversation"
        },
        status: {
            type: String,
            enum: ["ACTIVE", "CLOSED"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
