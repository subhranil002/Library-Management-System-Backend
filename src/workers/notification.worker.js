import { Notification, User } from "../models/index.js";
import { sendEmail } from "../utils/sendMail.js";

/**
 * Worker function to process a single notification.
 * Handles the actual channel delivery (e.g., Email, SMS) and status updates.
 * @param {string} notificationId - The MongoDB _id of the notification
 */
export const processNotificationEvent = async (notificationId) => {
    try {
        const notification = await Notification.findById(notificationId).populate("user", "email name");
        
        if (!notification || notification.status !== "PENDING") {
            return; // Already processed or doesn't exist
        }

        const user = notification.user;
        if (!user || !user.email) {
            notification.status = "FAILED";
            await notification.save();
            return;
        }

        // --- DELIVERY LOGIC (Channel: EMAIL) ---
        // Here we can extend logic later for push notifications or SMS
        const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px;">
                <h3>Hello ${user.name},</h3>
                <p><strong>${notification.title}</strong></p>
                <p>${notification.message}</p>
                <hr />
                <p style="font-size: 12px; color: #888;">This is an automated message from BookSphere.</p>
            </div>
        `;

        const emailSent = await sendEmail(user.email, notification.title, htmlContent);

        if (emailSent) {
            notification.status = "SENT";
            notification.sentAt = new Date();
        } else {
            notification.status = "FAILED";
        }

        await notification.save();
        
    } catch (error) {
        console.error(`Worker error processing notification ${notificationId}:`, error);
        
        // Handle basic retries or fail state
        try {
            await Notification.findByIdAndUpdate(notificationId, { status: "FAILED" });
        } catch (dbErr) {
            console.error("Failed to update notification status to FAILED:", dbErr);
        }
    }
};
