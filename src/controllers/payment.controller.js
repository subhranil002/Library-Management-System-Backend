import { Payment } from "../models/payment.model.js";
import { BookTransaction } from "../models/bookTransaction.model.js";
import { Fine } from "../models/fine.model.js";
import razorpayInstance from "../config/razorpay.config.js";
import constants from "../constants.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import crypto from "crypto";
import { differenceInDays } from "date-fns";

export const getApiKey = asyncHandler(async (req, res) => {
    try {
        // Send response
        return res.status(200).json(
            new ApiResponse("API key fetched successfully", {
                apiKey: constants.RAZORPAY_KEY_ID
            })
        );
    } catch (error) {
        return next(
            new ApiError(
                `payment.controller :: getApiKey :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const createPayment = asyncHandler(async (req, res, next) => {
    try {
        // get payment details from params
        const { book_transaction_id } = req.params;

        // Validate input data
        if (!book_transaction_id) {
            throw new ApiError("Book transaction id is required", 400);
        }

        // find book transaction in database
        const bookTransaction = await BookTransaction.findOne({
            _id: book_transaction_id,
            status: "FINED"
        });
        if (!bookTransaction) {
            throw new ApiError("Invalid book transaction details", 400);
        }

        // Check if payment is already created
        const payment = await Payment.findOne({
            transaction_id: bookTransaction._id,
            status: {
                $in: ["CREATED", "COMPLETED", "PAID"]
            }
        });
        if (payment) {
            throw new ApiError("Payment already created", 400);
        }

        // calculate fine amount
        const overdueDays = differenceInDays(
            new Date(),
            bookTransaction.returnDate
        );
        const fineAmount = overdueDays * constants.FINE_AMOUNT_PER_DAY;

        // Create payment options
        const options = {
            amount: fineAmount * 100,
            currency: "INR"
        };

        // Create payment
        const order = await razorpayInstance.orders
            .create(options)
            .catch(err => {
                throw new ApiError(`Failed to create payment: ${err}`, 400);
            });

        // Add orderId to database
        await Payment.create({
            transaction_id: bookTransaction._id,
            razorpay_order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status.toUpperCase()
        });

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Payment created successfully", order));
    } catch (error) {
        return next(
            new ApiError(
                `payment.controller :: createPayment :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const verifyPayment = asyncHandler(async (req, res, next) => {
    try {
        // Get payment details
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
            req.body;

        // Validate input data
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            throw new ApiError("All fields are required", 400);
        }

        // Find order_id in database
        const payment = await Payment.findOne({
            razorpay_order_id
        });
        if (!payment) {
            throw new ApiError("Invalid payment details", 400);
        }

        // Check if order is paid or failed or canceled
        if (payment.status === "PAID") {
            throw new ApiError("Already paid", 400);
        } else if (payment.status === "FAILED") {
            throw new ApiError("Payment failed, create a new payment", 400);
        } else if (payment.status === "CANCELLED") {
            throw new ApiError("Payment canceled, create a new payment", 400);
        }

        // Generate signature
        const generatedSignature = crypto
            .createHmac("sha256", constants.RAZORPAY_SECRET)
            .update(payment.razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        // Check if signature matches
        if (generatedSignature !== razorpay_signature) {
            payment.status = "FAILED";
            await payment.save();
            throw new ApiError("Invalid payment details", 400);
        }

        // Save payment details to database
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.status = "PAID";
        payment.razorpay_signature = razorpay_signature;
        await payment.save();

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Payment verified successfully", payment));
    } catch (error) {
        return next(
            new ApiError(
                `payment.controller :: verifyPayment :: ${error}`,
                error.statusCode
            )
        );
    }
});
