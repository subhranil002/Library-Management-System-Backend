import { Reservation, Book, BookTransaction, User } from "../models/index.js";
import { notifyReservationAvailable } from "../services/notification.service.js";
import { addHours } from "date-fns";

export const MAX_RESERVATIONS_PER_USER = 3;
export const RESERVATION_EXPIRY_HOURS = 48;

/**
 * Recalculate queue positions for a specific book
 * @param {string} isbn13 
 */
export const recalculateQueue = async (isbn13) => {
    const waitingReservations = await Reservation.find({
        isbn13,
        status: "WAITING"
    }).sort({ createdAt: 1 });

    for (let i = 0; i < waitingReservations.length; i++) {
        waitingReservations[i].queuePosition = i + 1;
        await waitingReservations[i].save();
    }
};

/**
 * Assign an available copy to the next eligible user in the queue
 * @param {string} isbn13 
 */
export const assignNextInQueue = async (isbn13) => {
    // Find the first waiting user
    const nextReservation = await Reservation.findOne({
        isbn13,
        status: "WAITING"
    }).sort({ queuePosition: 1, createdAt: 1 }).populate("user");

    if (!nextReservation) return null; // Queue is empty

    // Mark as available
    nextReservation.status = "AVAILABLE";
    nextReservation.queuePosition = null;
    nextReservation.notifiedAt = new Date();
    nextReservation.expiresAt = addHours(new Date(), RESERVATION_EXPIRY_HOURS);
    await nextReservation.save();

    // Recalculate queue for remaining waiting users
    await recalculateQueue(isbn13);

    // Get book details for email
    const bookInfo = await Book.findOne({ "industryIdentifiers.isbn13": isbn13 });
    const title = bookInfo ? bookInfo.volumeInfo.title : "Reserved Book";

    // Notify user asynchronously via Notification Service
    if (nextReservation.user) {
        await notifyReservationAvailable(
            nextReservation.user._id, 
            title, 
            nextReservation.expiresAt
        );
    }

    return nextReservation;
};
