import { Router } from "express";
import {
    createPayment,
    forceCompletePayment,
    getApiKey,
    verifyPayment
} from "../controllers/payment.controller.js";
import {
    authorizedRoles,
    isLoggedIn,
    isVerified
} from "../middlewares/auth.middleware.js";

const paymentRouter = Router();

// Routes
paymentRouter
    .route("/apikey")
    .get(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        getApiKey
    );

paymentRouter
    .route("/create")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        createPayment
    );

paymentRouter.route("/verify").post(isLoggedIn, isVerified, verifyPayment);

paymentRouter
    .route("/force-complete/:razorpay_order_id")
    .get(
        isLoggedIn,
        isVerified,
        authorizedRoles("ADMIN"),
        forceCompletePayment
    );

export default paymentRouter;
