import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
import constants from "../constants.js";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            maxlength: [50, "Name must be less than 50 characters"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Invalid email format"
            ]
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
            trim: true,
            match: [
                /^(\+91[\-\s]?)?[0]?[6-9]\d{9}$/,
                "Invalid phone number format"
            ]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            trim: true
        },
        avatar: {
            public_id: {
                type: String,
                default: "",
                trim: true
            },
            secure_url: {
                type: String,
                default:
                    "https://res.cloudinary.com/de4zawd4d/image/upload/v1712392736/samples/cloudinary-icon.png",
                trim: true
            }
        },
        address: {
            country: {
                type: String,
                trim: true,
                required: [true, "Country is required"]
            },
            state: {
                type: String,
                trim: true,
                required: [true, "State is required"]
            },
            city: {
                type: String,
                trim: true,
                required: [true, "City is required"]
            },
            pincode: {
                type: String,
                trim: true,
                required: [true, "Pincode is required"]
            },
            address_line_1: {
                type: String,
                trim: true,
                required: [true, "Address line 1 is required"]
            },
            address_line_2: {
                type: String,
                trim: true,
                default: null
            }
        },
        role: {
            type: String,
            required: true,
            enum: ["USER", "LIBRARIAN", "ADMIN"],
            default: "USER"
        },
        verified: {
            type: Boolean,
            default: false
        },
        refreshToken: {
            type: String,
            default: null,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods = {
    isPasswordCorrect: async function (password) {
        return await bcrypt.compare(password, this.password);
    },
    generateAccessToken: function () {
        return JWT.sign(
            {
                _id: this._id
            },
            constants.ACCESS_TOKEN_SECRET,
            {
                expiresIn: constants.ACCESS_TOKEN_EXPIRE
            }
        );
    },
    generateRefreshToken: function () {
        return JWT.sign(
            {
                _id: this._id
            },
            constants.REFRESH_TOKEN_SECRET,
            {
                expiresIn: constants.REFRESH_TOKEN_EXPIRE
            }
        );
    }
};

export const User = mongoose.model("User", userSchema);
