import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { processChatMessage, getSessionHistory } from "../services/assistant.service.js";
import { ChatSession } from "../models/index.js";
import mongoose from "mongoose";

// Send a message to the assistant
export const chat = asyncHandler(async (req, res, next) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user._id;

        if (!message) {
            throw new ApiError("Message text is required", 400);
        }

        // Use provided sessionId or generate a new one
        const activeSessionId = sessionId || new mongoose.Types.ObjectId().toString();

        const assistantReply = await processChatMessage(userId, activeSessionId, message);

        res.status(200).json(new ApiResponse("Message processed", {
            sessionId: activeSessionId,
            reply: assistantReply.message,
            intent: assistantReply.intent,
            matchedBooks: assistantReply.matchedBooks
        }));
    } catch (error) {
        next(new ApiError(`assistant.controller :: chat :: ${error.message}`, error.statusCode || 500));
    }
});

// Fetch full conversation history
export const getSession = asyncHandler(async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;

        const history = await getSessionHistory(sessionId, userId);

        res.status(200).json(new ApiResponse("Session history fetched", history));
    } catch (error) {
        next(new ApiError(`assistant.controller :: getSession :: ${error.message}`, error.statusCode || 500));
    }
});

// Fetch all active sessions for user
export const getUserSessions = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const sessions = await ChatSession.find({ user: userId }).sort({ updatedAt: -1 });

        res.status(200).json(new ApiResponse("User sessions fetched", sessions));
    } catch (error) {
        next(new ApiError(`assistant.controller :: getUserSessions :: ${error.message}`, error.statusCode || 500));
    }
});
