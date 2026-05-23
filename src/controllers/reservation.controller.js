import { ApiResponse, asyncHandler } from "../utils/index.js";
import reservationService from "../services/reservation.service.js";

// Place a hold on a book
export const placeReservation = asyncHandler(async (req, res, next) => {
    try {
        const { isbn13 } = req.body;
        const userId = req.user._id;

        const result = await reservationService.placeReservation(
            userId,
            isbn13,
            req.user.verified
        );

        res.status(201).json(new ApiResponse("Reservation placed successfully", result));
    } catch (error) {
        next(error);
    }
});

// Get user's reservations
export const getMyReservations = asyncHandler(async (req, res, next) => {
    try {
        const reservations = await reservationService.getMyReservations(req.user._id);
        res.status(200).json(new ApiResponse("Reservations fetched", reservations));
    } catch (error) {
        next(error);
    }
});

// Cancel a reservation
export const cancelReservation = asyncHandler(async (req, res, next) => {
    try {
        const reservationId = req.params.id;
        const userId = req.user._id;

        await reservationService.cancelReservation(reservationId, userId);

        res.status(200).json(new ApiResponse("Reservation cancelled successfully", {}));
    } catch (error) {
        next(error);
    }
});
