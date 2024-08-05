import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (email) {
                return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(
                    email
                );
            },
            message: "Invalid email"
        }
    },
    otp: {
        type: String,
        required: [true, "OTP is required"],
        trim: true,
        minlength: [6, "OTP can't be less than 6 characters"],
        maxlength: [6, "OTP can't be more than 6 characters"]
    }
});

export const Otp = mongoose.model("Otp", otpSchema);
