import { EventEmitter } from "events";
import { processNotificationEvent } from "../workers/notification.worker.js";

// Custom Event Emitter instance for the notification system
class NotificationEmitter extends EventEmitter {}

export const notificationEvents = new NotificationEmitter();

// Centralized event names
export const NOTIFICATION_EVENT = {
    SEND_NOTIFICATION: "SEND_NOTIFICATION"
};

// Listeners
// When a SEND_NOTIFICATION event is emitted, hand it off to the background worker
notificationEvents.on(NOTIFICATION_EVENT.SEND_NOTIFICATION, async (notificationId) => {
    // Process asynchronously, do not await here to avoid blocking
    processNotificationEvent(notificationId).catch((err) => {
        console.error(`Failed to trigger notification worker for ID ${notificationId}:`, err);
    });
});
