/**
 * A simple keyword-based intent classifier.
 * This acts as a mock/v1 for what would later be an LLM-based classifier.
 * 
 * @param {string} message User's raw message
 * @returns {{ intent: string, entities: Object }}
 */
export const classifyIntent = (message) => {
    const text = message.toLowerCase();

    // Intent Definitions
    const INTENTS = {
        SEARCH_BOOKS: "SEARCH_BOOKS",
        CHECK_DUE_DATES: "CHECK_DUE_DATES",
        GET_POLICY: "GET_POLICY",
        RECOMMEND_BOOKS: "RECOMMEND_BOOKS",
        GREETING: "GREETING",
        UNKNOWN: "UNKNOWN"
    };

    let intent = INTENTS.UNKNOWN;
    let entities = {};

    // 1. GREETING
    if (/^(hi|hello|hey|howdy|good morning|good evening)/.test(text)) {
        return { intent: INTENTS.GREETING, entities };
    }

    // 2. CHECK_DUE_DATES
    if (text.includes("due") || text.includes("my books") || text.includes("return date") || text.includes("borrowed")) {
        return { intent: INTENTS.CHECK_DUE_DATES, entities };
    }

    // 3. GET_POLICY
    if (text.includes("how to") || text.includes("policy") || text.includes("rules") || text.includes("renew") || text.includes("fine")) {
        intent = INTENTS.GET_POLICY;
        
        // Extract topic
        if (text.includes("renew")) entities.topic = "renewal";
        else if (text.includes("fine") || text.includes("penalty")) entities.topic = "fines";
        else if (text.includes("reserve") || text.includes("hold")) entities.topic = "reservation";
        else entities.topic = "general";

        return { intent, entities };
    }

    // 4. RECOMMEND_BOOKS
    if (text.includes("recommend") || text.includes("suggest") || text.includes("like") || text.includes("similar to")) {
        intent = INTENTS.RECOMMEND_BOOKS;
        
        // Very basic entity extraction for "like [book title]"
        const likeMatch = text.match(/like\s(.+)/);
        if (likeMatch) {
            entities.similarTo = likeMatch[1].trim();
        }

        return { intent, entities };
    }

    // 5. SEARCH_BOOKS (Fallback catch-all for queries looking for books)
    if (text.includes("find") || text.includes("search") || text.includes("books on") || text.includes("available")) {
        intent = INTENTS.SEARCH_BOOKS;
        
        // Attempt to extract keyword
        const onMatch = text.match(/books on\s(.+)/);
        if (onMatch) {
            entities.query = onMatch[1].trim();
        } else {
            entities.query = text.replace(/(find|search|show me|books|available)/g, "").trim();
        }

        return { intent, entities };
    }

    // If we have some text but didn't match intents, default to trying to search
    if (text.length > 3 && intent === INTENTS.UNKNOWN) {
        return { intent: INTENTS.SEARCH_BOOKS, entities: { query: text } };
    }

    return { intent, entities };
};
