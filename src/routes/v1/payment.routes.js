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
    .route("/create/overdue-payment/:book_transaction_id")
    .get(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        autoCreateOverduePayment
    );

paymentRouter
    .route("/create/custom-payment")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        customPayment
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
