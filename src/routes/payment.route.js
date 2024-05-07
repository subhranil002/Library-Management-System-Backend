import { Router } from "express";
import {
    cancelPayment,
    completePayment,
    createPayment,
    getApiKey,
    verifyPayment
} from "../controllers/payment.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const paymentRouter = Router();

// Routes
paymentRouter.route("/apikey").get(isLoggedIn, getApiKey);
paymentRouter.route("/create/:book_transaction_id").post(isLoggedIn, createPayment);
paymentRouter.route("/verify").post(isLoggedIn, verifyPayment);
paymentRouter.route("/complete").post(isLoggedIn, completePayment);
paymentRouter
    .route("/cancel/:razorpay_order_id")
    .get(isLoggedIn, cancelPayment);

export default paymentRouter;
