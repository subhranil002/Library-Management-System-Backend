import { ChatSession, ChatMessage, LibraryPolicy, Book, BookTransaction } from "../models/index.js";
import { classifyIntent } from "../utils/intentClassifier.js";
import { getPersonalizedRecommendations } from "./recommendation.service.js";
import { 
    formatSearchResponse, 
    formatDueDatesResponse, 
    formatPolicyResponse, 
    formatGreeting, 
    formatUnknownResponse 
} from "../utils/responseFormatter.js";

/**
 * Handles incoming chat messages from a user and generates the assistant's response.
 * @param {string} userId 
 * @param {string} sessionId 
 * @param {string} messageText 
 */
export const processChatMessage = async (userId, sessionId, messageText) => {
    // 1. Verify or create session
    let session = await ChatSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
        session = await ChatSession.create({ _id: sessionId, user: userId });
    }

    // 2. Save user message
    await ChatMessage.create({
        session: sessionId,
        sender: "USER",
        message: messageText
    });

    // 3. Classify Intent
    const { intent, entities } = classifyIntent(messageText);

    let assistantResponse = "";
    let matchedBooks = [];

    // 4. Handle based on intent
    try {
        switch (intent) {
            case "GREETING":
                assistantResponse = formatGreeting();
                break;

            case "SEARCH_BOOKS":
                const searchQuery = entities.query || "";
                const books = await Book.find({
                    $or: [
                        { "volumeInfo.title": { $regex: searchQuery, $options: "i" } },
                        { "volumeInfo.author": { $regex: searchQuery, $options: "i" } },
                        { genre: { $regex: searchQuery, $options: "i" } }
                    ]
                }).limit(5).lean();
                
                matchedBooks = books.map(b => b._id);
                assistantResponse = formatSearchResponse(books, searchQuery);
                break;

            case "RECOMMEND_BOOKS":
                // In a true RAG we'd use vector search. Here we use our recommendation service.
                const recommendations = await getPersonalizedRecommendations(userId);
                // Return top 3
                const topRecs = recommendations.slice(0, 3);
                matchedBooks = topRecs.map(b => b._id);
                assistantResponse = formatSearchResponse(topRecs, "Recommended for you");
                break;

            case "CHECK_DUE_DATES":
                const transactions = await BookTransaction.find({
                    "borrowedBy._id": userId,
                    status: "PENDING"
                }).populate("book");
                assistantResponse = formatDueDatesResponse(transactions);
                break;

            case "GET_POLICY":
                const topic = entities.topic;
                // Basic text search on policy keywords
                const policy = await LibraryPolicy.findOne({
                    $or: [
                        { topic: { $regex: topic, $options: "i" } },
                        { keywords: { $regex: topic, $options: "i" } }
                    ]
                });
                assistantResponse = formatPolicyResponse(policy, topic);
                break;

            case "UNKNOWN":
            default:
                assistantResponse = formatUnknownResponse();
                break;
        }
    } catch (error) {
        console.error("Assistant processing error:", error);
        assistantResponse = "I'm sorry, I encountered an internal error while trying to process your request.";
    }

    // 5. Save and return Assistant response
    const assistantMessage = await ChatMessage.create({
        session: sessionId,
        sender: "ASSISTANT",
        message: assistantResponse,
        intent: intent,
        matchedBooks: matchedBooks
    });

    return assistantMessage;
};

/**
 * Fetches the entire conversation history for a session
 */
export const getSessionHistory = async (sessionId, userId) => {
    // Verify ownership
    const session = await ChatSession.findOne({ _id: sessionId, user: userId });
    if (!session) throw new Error("Session not found");

    return await ChatMessage.find({ session: sessionId }).sort({ createdAt: 1 });
};
