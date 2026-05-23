import { Router } from "express";
import { isLoggedIn, isVerified } from "../../middlewares/auth.middleware.js";
import { placeReservation, getMyReservations, cancelReservation } from "../../controllers/reservation.controller.js";

const reservationRouter = Router();

// Secure all reservation routes
reservationRouter.use(isLoggedIn);
reservationRouter.use(isVerified);

reservationRouter.route("/").post(placeReservation);
reservationRouter.route("/me").get(getMyReservations);
reservationRouter.route("/:id/cancel").post(cancelReservation);

export default reservationRouter;
