/**
 * Formats data results into human-readable chat responses
 */

export const formatSearchResponse = (books, query) => {
    if (!books || books.length === 0) {
        return `I couldn't find any books matching "${query}". Try searching for a different topic or author.`;
    }

    let response = `I found ${books.length} book(s) that might interest you:\n\n`;
    books.forEach((book, index) => {
        response += `${index + 1}. **${book.volumeInfo.title}** by ${book.volumeInfo.author}\n`;
    });

    response += `\nWould you like to reserve any of these or see their branch availability?`;
    return response;
};

export const formatDueDatesResponse = (transactions) => {
    if (!transactions || transactions.length === 0) {
        return "You don't have any actively borrowed books right now. Let me know if you want recommendations!";
    }

    let response = `Here are your currently borrowed books:\n\n`;
    transactions.forEach(t => {
        const dueDate = new Date(t.returnDate).toLocaleDateString();
        response += `- **${t.book.volumeInfo.title}**: Due on ${dueDate} (${t.status})\n`;
    });

    return response;
};

export const formatPolicyResponse = (policy, topic) => {
    if (!policy) {
        return `I'm sorry, I couldn't find specific policy details regarding "${topic}". Please contact the front desk for clarification.`;
    }

    return policy.content;
};

export const formatGreeting = () => {
    return "Hello! I am your AI Library Assistant. I can help you find books, check your due dates, provide recommendations, or answer questions about our library policies. How can I help you today?";
};

export const formatUnknownResponse = () => {
    return "I'm not quite sure how to help with that. Could you try rephrasing? You can ask me to find books, check your due dates, or explain our renewal policies.";
};
