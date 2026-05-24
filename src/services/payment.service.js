import paymentRepository from "../repositories/payment.repository.js";
import transactionRepository from "../repositories/transaction.repository.js";
import { Fine } from "../models/index.js";
import { razorpayInstance } from "../config/index.js";
import { ApiError } from "../utils/index.js";
import constants from "../constants.js";
import crypto from "crypto";
import { differenceInDays, endOfTomorrow } from "date-fns";

class PaymentService {
    async createOverduePayment(transactionId) {
        const bookTransaction = await transactionRepository.findOne({
            _id: transactionId,
            status: "FINED"
        });
        if (!bookTransaction) {
            throw new ApiError("Invalid book transaction details or transaction not fined", 400);
        }

        const existingPayment = await paymentRepository.findOne({
            transaction_id: bookTransaction._id,
            status: { $in: ["CREATED", "PAID"] }
        });
        if (existingPayment) {
            throw new ApiError("Payment already created", 400);
        }

        const overdueDays = differenceInDays(new Date(), bookTransaction.returnDate);
        const fineAmount = overdueDays * constants.FINE_AMOUNT_PER_DAY;

        const options = {
            amount: fineAmount * 100,
            currency: "INR"
        };

        const order = await razorpayInstance.orders.create(options).catch(err => {
            throw new ApiError(`Failed to create Razorpay payment order: ${err}`, 400);
        });

        const newPayment = await paymentRepository.create({
            transaction_id: bookTransaction._id,
            razorpay_order_id: order.id,
            amount: order.amount / 100,
            currency: order.currency,
            status: "CREATED"
        });

        const fine = await Fine.create({
            transaction: bookTransaction,
            fineAmount: fineAmount,
            fineReason: "Overdue",
            status: "CREATED",
            payment: newPayment
        });

        return fine;
    }

    async createCustomPayment(bookCode, fineReason, fineAmount) {
        const bookTransaction = await transactionRepository.findOne({
            "book.bookCode": bookCode,
            status: { $in: ["FINED", "PENDING"] }
        });
        if (!bookTransaction) {
            throw new ApiError("Book not issued yet", 400);
        }

        const existingPayment = await paymentRepository.findOne({
            transaction_id: bookTransaction._id,
            status: "CREATED"
        });
        if (existingPayment) {
            throw new ApiError("Payment already created", 400);
        }

        const options = {
            amount: fineAmount * 100,
            currency: "INR"
        };

        const order = await razorpayInstance.orders.create(options).catch(err => {
            throw new ApiError(`Failed to create Razorpay payment order: ${err}`, 400);
        });

        const newPayment = await paymentRepository.create({
            transaction_id: bookTransaction._id,
            razorpay_order_id: order.id,
            amount: order.amount / 100,
            currency: order.currency,
            status: "CREATED"
        });

        bookTransaction.status = "FINED";
        await bookTransaction.save();

        const fine = await Fine.create({
            transaction: bookTransaction,
            fineAmount: fineAmount,
            fineReason: fineReason,
            status: "CREATED",
            payment: newPayment
        });

        return fine;
    }

    async verifyPaymentSignature(razorpayPaymentId, razorpayOrderId, razorpaySignature) {
        const payment = await paymentRepository.findOne({
            razorpay_order_id: razorpayOrderId,
            status: "CREATED"
        });
        if (!payment) {
            throw new ApiError("Invalid order id", 400);
        }

        const generatedSignature = crypto
            .createHmac("sha256", constants.RAZORPAY_SECRET)
            .update(payment.razorpay_order_id + "|" + razorpayPaymentId)
            .digest("hex");

        if (generatedSignature !== razorpaySignature) {
            throw new ApiError("Invalid razorpay signature verification", 400);
        }

        payment.razorpay_payment_id = razorpayPaymentId;
        payment.status = "PAID";
        payment.razorpay_signature = razorpaySignature;
        await payment.save();

        const bookTransaction = await transactionRepository.findOne({ _id: payment.transaction_id });
        const fine = await Fine.findOne({ "payment.razorpay_order_id": razorpayOrderId });

        bookTransaction.status = "PENDING";
        bookTransaction.returnDate = endOfTomorrow();
        await bookTransaction.save();

        fine.status = "PAID";
        fine.payment = payment;
        await fine.save();

        return fine;
    }

    async forceCompletePaymentRecord(razorpayOrderId) {
        const payment = await paymentRepository.findOne({
            razorpay_order_id: razorpayOrderId,
            status: "CREATED"
        });
        if (!payment) {
            throw new ApiError("Invalid order id", 400);
        }

        payment.status = "PAID";
        await payment.save();

        const bookTransaction = await transactionRepository.findOne({ _id: payment.transaction_id });
        const fine = await Fine.findOne({ "payment.razorpay_order_id": razorpayOrderId });

        bookTransaction.status = "PENDING";
        bookTransaction.returnDate = endOfTomorrow();
        await bookTransaction.save();

        fine.status = "PAID";
        fine.payment = payment;
        await fine.save();

        return fine;
    }
}

export default new PaymentService();
