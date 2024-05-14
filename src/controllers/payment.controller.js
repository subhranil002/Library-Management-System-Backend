import { Payment } from "../models/payment.model.js";
import { BookTransaction } from "../models/bookTransaction.model.js";
import { Fine } from "../models/fine.model.js";
import razorpayInstance from "../config/razorpay.config.js";
import constants from "../constants.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import crypto from "crypto";
import { endOfTomorrow } from "date-fns";

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
        // get payment details from request
        const { bookCode, fineReason, fineAmount } = req.body;

        // Validate input data
        if (!bookCode || !fineReason.trim() || !fineAmount) {
            throw new ApiError("All fields are required", 400);
        }
        if (fineAmount <= 0) {
            throw new ApiError("Fine amount must be a positive number", 400);
        }

        // find book transaction in database
        const bookTransaction = await BookTransaction.findOne({
            "book.bookCode": bookCode,
            status: {
                $in: ["FINED", "PENDING"]
            }
        });
        if (!bookTransaction) {
            throw new ApiError("Book not issued yet", 400);
        }

        // Check if payment is already created
        const payment = await Payment.findOne({
            transaction_id: bookTransaction._id,
            status: "CREATED"
        });
        if (payment?.status === "CREATED") {
            throw new ApiError("Payment already created", 400);
        }

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
        const newPayment = await Payment.create({
            transaction_id: bookTransaction._id,
            razorpay_order_id: order.id,
            amount: order.amount / 100,
            currency: order.currency,
            status: "CREATED"
        });

        // Set book transaction as fined
        bookTransaction.status = "FINED";
        await bookTransaction.save();

        // Save fine details to database
        const fine = await Fine.create({
            transaction: bookTransaction,
            fineAmount: fineAmount,
            fineReason: fineReason,
            status: "CREATED",
            payment: newPayment
        });

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Payment created successfully", fine));
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
            razorpay_order_id,
            status: "CREATED"
        });
        if (!payment) {
            throw new ApiError("Invalid order id", 400);
        }

        // Generate signature
        const generatedSignature = crypto
            .createHmac("sha256", constants.RAZORPAY_SECRET)
            .update(payment.razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        // Check if signature matches
        if (generatedSignature !== razorpay_signature) {
            throw new ApiError("Invalid razorpay signature", 400);
        }

        // Save payment details to database
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.status = "PAID";
        payment.razorpay_signature = razorpay_signature;
        await payment.save();

        // Find book transaction and fine in database
        const bookTransaction = await BookTransaction.findOne({
            _id: payment.transaction_id
        });
        const fine = await Fine.findOne({
            "payment.razorpay_order_id": payment.razorpay_order_id
        }) 

        // Update transaction and fine details
        bookTransaction.status = "PENDING";
        bookTransaction.returnDate = endOfTomorrow();
        await bookTransaction.save();
        fine.status = "PAID";
        fine.payment = payment;
        await fine.save();

        // Send response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    "Payment verified and completed successfully",
                    fine
                )
            );
    } catch (error) {
        return next(
            new ApiError(
                `payment.controller :: verifyPayment :: ${error}`,
                error.statusCode
            )
        );
    }
});
