import { ApiResponse, asyncHandler } from "../utils/index.js";
import paymentService from "../services/payment.service.js";
import constants from "../constants.js";

export const getApiKey = asyncHandler(async (req, res, next) => {
    try {
        return res.status(200).json(
            new ApiResponse("API key fetched successfully", {
                apiKey: constants.RAZORPAY_KEY_ID
            })
        );
    } catch (error) {
        return next(error);
    }
});

export const autoCreateOverduePayment = asyncHandler(async (req, res, next) => {
    try {
        const { book_transaction_id } = req.params;
        const fine = await paymentService.createOverduePayment(book_transaction_id);

        return res.status(200).json(new ApiResponse("Payment created successfully", fine));
    } catch (error) {
        return next(error);
    }
});

export const customPayment = asyncHandler(async (req, res, next) => {
    try {
        const { bookCode, fineReason, fineAmount } = req.body;
        const fine = await paymentService.createCustomPayment(bookCode, fineReason, fineAmount);

        return res.status(200).json(new ApiResponse("Payment created successfully", fine));
    } catch (error) {
        return next(error);
    }
});

export const verifyPayment = asyncHandler(async (req, res, next) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const fine = await paymentService.verifyPaymentSignature(
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        );

        return res.status(200).json(
            new ApiResponse("Payment verified and completed successfully", fine)
        );
    } catch (error) {
        return next(error);
    }
});

export const forceCompletePayment = asyncHandler(async (req, res, next) => {
    try {
        const { razorpay_order_id } = req.params;
        const fine = await paymentService.forceCompletePaymentRecord(razorpay_order_id);

        return res.status(200).json(
            new ApiResponse("Payment force completed successfully", fine)
        );
    } catch (error) {
        return next(error);
    }
});
