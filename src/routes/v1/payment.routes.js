import { Router } from "express";
import {
    autoCreateOverduePayment,
    customPayment,
    forceCompletePayment,
    getApiKey,
    verifyPayment
} from "../../controllers/payment.controller.js";
import {
    authorizedRoles,
    isLoggedIn,
    isVerified
} from "../../middlewares/auth.middleware.js";
import { rateLimiter } from "../../middlewares/index.js";

const paymentRouter = Router();

// Rate limiters for payment routes
const paymentCreateLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxLimit: 5,
    message: "Too many payment creation attempts. Please try again later."
});

const paymentVerifyLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxLimit: 5,
    message: "Too many payment verification attempts. Please try again later."
});

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
    .route("/create/overdue-payment/:book_transaction_id")
    .get(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        paymentCreateLimiter,
        autoCreateOverduePayment
    );

paymentRouter
    .route("/create/custom-payment")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        paymentCreateLimiter,
        customPayment
    );

paymentRouter.route("/verify").post(isLoggedIn, isVerified, paymentVerifyLimiter, verifyPayment);

paymentRouter
    .route("/force-complete/:razorpay_order_id")
    .get(
        isLoggedIn,
        isVerified,
        authorizedRoles("ADMIN"),
        forceCompletePayment
    );

export default paymentRouter;
