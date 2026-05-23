import reservationRepository from "../repositories/reservation.repository.js";
import bookRepository from "../repositories/book.repository.js";
import transactionRepository from "../repositories/transaction.repository.js";
import { ApiError } from "../utils/index.js";
import { 
    recalculateQueue, 
    assignNextInQueue, 
    MAX_RESERVATIONS_PER_USER 
} from "../helpers/reservation.helper.js";

class ReservationService {
    async placeReservation(userId, isbn13, userVerified) {
        // Check catalog
        const bookExists = await bookRepository.findByIsbn13(isbn13);
        if (!bookExists) {
            throw new ApiError("Book not found in catalog", 404);
        }

        if (!userVerified) {
            throw new ApiError("User must be verified to place reservations", 403);
        }

        // Check active reservations
        const existingReservation = await reservationRepository.findOne({
            user: userId,
            isbn13,
            status: { $in: ["WAITING", "AVAILABLE"] }
        });
        if (existingReservation) {
            throw new ApiError("You already have an active reservation for this book", 400);
        }

        const activeReservationsCount = await reservationRepository.countDocuments({
            user: userId,
            status: { $in: ["WAITING", "AVAILABLE"] }
        });
        if (activeReservationsCount >= MAX_RESERVATIONS_PER_USER) {
            throw new ApiError(`You have reached the maximum limit of ${MAX_RESERVATIONS_PER_USER} active reservations`, 400);
        }

        // Determine availability
        const totalCopies = await bookRepository.countDocuments({ "industryIdentifiers.isbn13": isbn13 });
        const issuedCopiesCount = await transactionRepository.countDocuments({
            "book.industryIdentifiers.isbn13": isbn13,
            status: { $in: ["PENDING", "FINED"] }
        });
        const availableReservationsCount = await reservationRepository.countDocuments({
            isbn13,
            status: "AVAILABLE"
        });

        const usableCopies = totalCopies - issuedCopiesCount - availableReservationsCount;
        let status = "WAITING";
        let queuePosition = null;

        if (usableCopies > 0) {
            status = "AVAILABLE";
        } else {
            const queueLength = await reservationRepository.countDocuments({
                isbn13,
                status: "WAITING"
            });
            queuePosition = queueLength + 1;
        }

        const newReservation = await reservationRepository.create({
            user: userId,
            isbn13,
            status,
            queuePosition
        });

        if (status === "AVAILABLE") {
            newReservation.status = "WAITING";
            await newReservation.save();
            await assignNextInQueue(isbn13);
        }

        return { status, queuePosition };
    }

    async getMyReservations(userId) {
        return await reservationRepository.find({ user: userId });
    }

    async cancelReservation(reservationId, userId) {
        const reservation = await reservationRepository.findOne({
            _id: reservationId,
            user: userId,
            status: { $in: ["WAITING", "AVAILABLE"] }
        });

        if (!reservation) {
            throw new ApiError("Active reservation not found", 404);
        }

        const wasAvailable = reservation.status === "AVAILABLE";
        const isbn13 = reservation.isbn13;

        reservation.status = "CANCELLED";
        reservation.queuePosition = null;
        await reservation.save();

        await recalculateQueue(isbn13);

        if (wasAvailable) {
            await assignNextInQueue(isbn13);
        }

        return true;
    }
}

export default new ReservationService();
