import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        transaction_id: {
            type: String,
            required: true,
            trim: true
        },
        razorpay_order_id: {
            type: String,
            required: true,
            trim: true
        },
        razorpay_payment_id: {
            type: String,
            trim: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true,
            default: "CREATED",
            enum: ["CREATED", "CANCELLED", "PAID"]
        },
        razorpay_signature: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const Payment = mongoose.model("Payment", paymentSchema);
