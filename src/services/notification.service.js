import { Notification } from "../models/index.js";
import { notificationEvents, NOTIFICATION_EVENT } from "../events/notification.events.js";

/**
 * Creates a notification record and emits an event to send it asynchronously.
 * 
 * @param {Object} params - Notification details
 * @param {string} params.user - User ObjectId
 * @param {string} params.type - Notification type (e.g., OVERDUE_REMINDER, FINE_ALERT)
 * @param {string} params.title - Subject or title
 * @param {string} params.message - Body content
 * @param {Object} [params.metadata] - Extra context (like bookId, fineAmount)
 * @returns {Promise<Object>} The created notification object
 */
export const triggerNotification = async ({ user, type, title, message, metadata = {} }) => {
    try {
        // 1. Persist the notification history in MongoDB
        const notification = await Notification.create({
            user,
            type,
            title,
            message,
            metadata,
            status: "PENDING"
        });

        // 2. Fire and forget event so the API response isn't delayed by email servers
        notificationEvents.emit(NOTIFICATION_EVENT.SEND_NOTIFICATION, notification._id);

        return notification;
    } catch (error) {
        console.error("Failed to trigger notification:", error);
        // We do not throw here to avoid breaking the core business flow (like returning a book)
        return null;
    }
};

// Convenience templates

export const notifyReservationAvailable = async (userId, bookTitle, expiryDate) => {
    return triggerNotification({
        user: userId,
        type: "RESERVATION_AVAILABLE",
        title: `Your reserved book is ready: ${bookTitle}`,
        message: `Good news! A copy of '${bookTitle}' is now available for you to pick up. Please collect it before ${new Date(expiryDate).toLocaleString()}.`,
        metadata: { bookTitle, expiryDate }
    });
};

export const notifyBookOverdue = async (userId, bookTitle, dueDate) => {
    return triggerNotification({
        user: userId,
        type: "OVERDUE_REMINDER",
        title: `Overdue Notice: ${bookTitle}`,
        message: `The book '${bookTitle}' was due on ${new Date(dueDate).toLocaleDateString()}. Please return it as soon as possible to avoid further fines.`,
        metadata: { bookTitle, dueDate }
    });
};

export const notifyFineAlert = async (userId, amount) => {
    return triggerNotification({
        user: userId,
        type: "FINE_ALERT",
        title: "New Fine Applied",
        message: `A fine of ₹${amount} has been added to your account for overdue returns.`,
        metadata: { amount }
    });
};

export const notifyRenewalApproved = async (userId, bookTitle, newDueDate) => {
    return triggerNotification({
        user: userId,
        type: "RENEWAL_APPROVED",
        title: `Renewal Approved: ${bookTitle}`,
        message: `Your request to renew '${bookTitle}' was approved. The new due date is ${new Date(newDueDate).toLocaleDateString()}.`,
        metadata: { bookTitle, newDueDate }
    });
};

export const notifyRenewalDenied = async (userId, bookTitle, reason) => {
    return triggerNotification({
        user: userId,
        type: "RENEWAL_DENIED",
        title: `Renewal Denied: ${bookTitle}`,
        message: `Your request to renew '${bookTitle}' could not be processed. Reason: ${reason}. Please return the book by the due date.`,
        metadata: { bookTitle, reason }
    });
};
