import { Reservation, Fine } from "../models/index.js";
import { isBefore } from "date-fns";

/**
 * Validates if a book transaction can be renewed
 * @param {Object} transaction - The BookTransaction object
 * @param {string} userId - The ID of the user requesting renewal
 * @returns {Promise<{allowed: boolean, reason: string}>}
 */
export const checkRenewalEligibility = async (transaction, userId) => {
    // 1. Basic structural checks
    if (!transaction) {
        return { allowed: false, reason: "Transaction not found." };
    }
    
    if (transaction.status !== "PENDING" && transaction.status !== "FINED") {
        return { allowed: false, reason: "Only active transactions can be renewed." };
    }

    if (transaction.borrowedBy._id.toString() !== userId.toString()) {
        return { allowed: false, reason: "You are not authorized to renew this book." };
    }

    // 2. Overdue check
    // Some libraries allow renewing overdue books if they pay the fine, but standard policy blocks it.
    if (isBefore(new Date(transaction.returnDate), new Date())) {
        return { allowed: false, reason: "Book is already overdue. Please return it or pay the fine first." };
    }

    // 3. Renewal count check
    if (transaction.renewalCount >= transaction.maxRenewals) {
        return { allowed: false, reason: "Maximum renewal limit reached for this book." };
    }

    // 4. Pending Reservation check
    // Check if anyone is waiting for this specific book ISBN
    const pendingReservations = await Reservation.countDocuments({
        isbn13: transaction.book.industryIdentifiers.isbn13,
        status: "WAITING"
    });
    
    if (pendingReservations > 0) {
        return { allowed: false, reason: "There are pending reservations for this book. Renewal is blocked." };
    }

    // 5. Unpaid fines check
    // Assuming you have a Fine model (based on exports). Check if unpaid fines exceed a threshold (e.g., ₹100).
    const unpaidFines = await Fine.find({ user: userId, status: "UNPAID" });
    const totalUnpaid = unpaidFines.reduce((sum, fine) => sum + fine.amount, 0);

    if (totalUnpaid >= 100) {
        return { allowed: false, reason: `You have unpaid fines totaling ₹${totalUnpaid}. Please clear your dues before renewing.` };
    }

    return { allowed: true, reason: "" };
};
