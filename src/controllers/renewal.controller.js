import { BookTransaction } from "../models/index.js";
import { ApiError, ApiResponse, asyncHandler, logAuditEvent } from "../utils/index.js";
import { checkRenewalEligibility } from "../helpers/renewalPolicy.js";
import { notifyRenewalApproved, notifyRenewalDenied } from "../services/notification.service.js";
import { addDays } from "date-fns";

export const renewBook = asyncHandler(async (req, res, next) => {
    try {
        const transactionId = req.params.borrowId;
        const userId = req.user._id;

        // Fetch transaction
        const transaction = await BookTransaction.findById(transactionId);
        if (!transaction) {
            throw new ApiError("Transaction not found", 404);
        }

        const bookTitle = transaction.book.volumeInfo.title;

        // Check policies
        const eligibility = await checkRenewalEligibility(transaction, userId);

        if (!eligibility.allowed) {
            // Log attempt and notify user
            await logAuditEvent(req, {
                actorId: userId,
                actorRole: req.user.role,
                actionType: "RENEWAL_DENIED",
                entityType: "BOOK_TRANSACTION",
                entityId: transaction._id,
                after: { reason: eligibility.reason }
            });

            await notifyRenewalDenied(userId, bookTitle, eligibility.reason);
            throw new ApiError(eligibility.reason, 400);
        }

        // Apply extension
        const currentDueDate = transaction.returnDate;
        
        // Ensure we preserve the original due date on first renewal
        if (transaction.renewalCount === 0) {
            transaction.originalDueDate = currentDueDate;
        }

        // Extend by 14 days (or your library policy)
        const newDueDate = addDays(new Date(currentDueDate), 14);
        
        transaction.returnDate = newDueDate;
        transaction.renewalCount += 1;
        transaction.lastRenewedAt = new Date();

        await transaction.save();

        // Audit Log
        await logAuditEvent(req, {
            actorId: userId,
            actorRole: req.user.role,
            actionType: "RENEWAL_APPROVED",
            entityType: "BOOK_TRANSACTION",
            entityId: transaction._id,
            before: { dueDate: currentDueDate },
            after: { dueDate: newDueDate, renewalCount: transaction.renewalCount }
        });

        // Notify
        await notifyRenewalApproved(userId, bookTitle, newDueDate);

        res.status(200).json(
            new ApiResponse("Book renewed successfully", {
                newDueDate,
                renewalCount: transaction.renewalCount,
                maxRenewals: transaction.maxRenewals
            })
        );
    } catch (error) {
        next(new ApiError(`renewal.controller :: renewBook :: ${error.message}`, error.statusCode || 500));
    }
});

export const getRenewalStatus = asyncHandler(async (req, res, next) => {
    try {
        const transactionId = req.params.borrowId;
        const userId = req.user._id;

        const transaction = await BookTransaction.findById(transactionId);
        
        if (!transaction) {
            throw new ApiError("Transaction not found", 404);
        }

        const eligibility = await checkRenewalEligibility(transaction, userId);

        res.status(200).json(
            new ApiResponse("Renewal status fetched", {
                isEligible: eligibility.allowed,
                reason: eligibility.reason,
                renewalCount: transaction.renewalCount || 0,
                maxRenewals: transaction.maxRenewals || 2
            })
        );
    } catch (error) {
        next(new ApiError(`renewal.controller :: getRenewalStatus :: ${error.message}`, error.statusCode || 500));
    }
});
