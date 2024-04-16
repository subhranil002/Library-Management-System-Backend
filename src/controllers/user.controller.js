import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateAccessAndRefreshToken from "../utils/generateTokens.util.js";

export const register = asyncHandler(async (req, res, next) => {
    try {
        // Get user data from request
        const {
            name,
            email,
            phone,
            password,
            country,
            state,
            city,
            pincode,
            address_line_1,
            address_line_2,
            role
        } = req.body;

        // validate request data
        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            !country ||
            !state ||
            !city ||
            !pincode ||
            !address_line_1
        ) {
            throw new ApiError("All fields are required", 400);
        }

        // validate email, phone, password and role
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            throw new ApiError("Invalid email format", 400);
        }
        if (!/^(\+91[\-\s]?)?[0]?[6-9]\d{9}$/.test(phone)) {
            throw new ApiError("Invalid phone number format", 400);
        }
        if (password.length < 8) {
            throw new ApiError("Password must be at least 8 characters", 400);
        }
        if (
            role &&
            role !== "USER" &&
            role !== "LIBRARIAN" &&
            role !== "ADMIN"
        ) {
            throw new ApiError("Invalid role", 400);
        } else if (role === "ADMIN") {
            throw new ApiError("Admin cannot register", 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });
        if (existingUser) {
            throw new ApiError("User already exists", 400);
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            phone,
            password,
            address: {
                country,
                state,
                city,
                pincode,
                address_line_1,
                address_line_2
            },
            role
        });

        // Check if user created successfully
        const user = await User.findById(newUser._id);
        if (!user) {
            throw new ApiError("User not created", 400);
        }

        // Send response
        return res
            .status(200)
            .json(
                new ApiResponse("User created successfully, Please login", {})
            );
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: register: ${error}`,
                error.statusCode
            )
        );
    }
});

export const login = asyncHandler(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate request data
        if (!email || !password) {
            throw new ApiError("All fields are required", 400);
        }

        // validate email, password
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            throw new ApiError("Incorrect email or password", 400);
        }
        if (password.length < 8) {
            throw new ApiError("Password must be at least 8 characters", 400);
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError("Incorrect email or password", 400);
        }

        // Check if password is correct
        if (!(await user.isPasswordCorrect(password))) {
            throw new ApiError("Incorrect email or password", 400);
        }

        // Generate access and refresh token
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(isExists);

        // Cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: true
        };

        // Send response
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse("Login successful", {}));
    } catch (error) {
        return next(
            new ApiError(`user.controller :: login: ${error}`, error.statusCode)
        );
    }
});

export const logout = asyncHandler(async (req, res, next) => {
    try {
        // Get user from request and unset refresh token
        await User.findByIdAndUpdate(req.user._id, {
            $unset: {
                refreshToken: 1
            }
        });

        // Send response and clear cookies
        return res
            .status(200)
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .json(new ApiResponse("Logout successful", {}));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: logout: ${error}`,
                error.statusCode
            )
        );
    }
});
