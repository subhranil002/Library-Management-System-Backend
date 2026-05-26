import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
    {
        session: {
            type: Schema.Types.ObjectId,
            ref: "ChatSession",
            required: true,
            index: true
        },
        sender: {
            type: String,
            enum: ["USER", "ASSISTANT"],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        intent: {
            type: String,
            default: null
        },
        confidence: {
            type: Number,
            default: 1.0
        },
        matchedBooks: [
            {
                type: Schema.Types.ObjectId,
                ref: "Book"
            }
        ],
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
