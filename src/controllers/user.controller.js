import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateAccessAndRefreshToken from "../utils/generateTokens.util.js";
import {
    deleteLocalFiles,
    uploadImage,
    deleteImage
} from "../utils/fileHandler.js";
import jwt from "jsonwebtoken";
import constants from "../constants.js";

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
        const newUser = await User.create({
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
            await generateAccessAndRefreshToken(user);

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

export const getCurrentUser = asyncHandler(async (req, res, next) => {
    try {
        // Get user details
        const user = await User.findById(req.user._id).select(
            "-password -borrowedBooks -refreshToken"
        );

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Profile fetched successfully", user));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: getCurrentUser :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const changeAvatar = asyncHandler(async (req, res, next) => {
    try {
        // Get avatar file from request
        const avatarLocalPath = req.file ? req.file.path : "";

        // Check if avatar file is empty
        if (!avatarLocalPath) {
            deleteLocalFiles([avatarLocalPath]);
            throw new ApiError("No avatar file provided", 400);
        }

        // Find current user
        const user = await User.findById(req.user._id).select("avatar");
        if (!user) {
            deleteLocalFiles([avatarLocalPath]);
            throw new ApiError("Unauthorized request, please login again", 401);
        }

        // Upload avatar to Cloudinary
        const newAvatar = await uploadImage(avatarLocalPath);
        if (!newAvatar.public_id || !newAvatar.secure_url) {
            deleteLocalFiles([avatarLocalPath]);
            throw new ApiError("Error uploading avatar", 400);
        }

        // Delete old avatar
        const result = await deleteImage(user.avatar.public_id);
        if (!result) {
            deleteImage(newAvatar.public_id);
            throw new ApiError("Error deleting old avatar", 400);
        }

        // Update user with new avatar
        const updatedAvatar = await User.findByIdAndUpdate(
            req.user._id,
            {
                avatar: {
                    public_id: newAvatar.public_id,
                    secure_url: newAvatar.secure_url
                }
            },
            { new: true }
        ).select("avatar");

        // Return updated user
        return res
            .status(200)
            .json(
                new ApiResponse("Avatar changed successfully", updatedAvatar)
            );
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: changeAvatar :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const changePassword = asyncHandler(async (req, res, next) => {
    try {
        // Get old and new password from request
        const { oldPassword, newPassword } = req.body;

        // Check if any of the fields is empty
        if (!oldPassword || !newPassword) {
            throw new ApiError("All fields are required", 400);
        }

        // Validate password
        if (oldPassword.length < 8 || newPassword.length < 8) {
            throw new ApiError("Password must be at least 8 characters", 400);
        }

        // Find current user
        const user = await User.findById(req.user._id).select("password");
        if (!user) {
            throw new ApiError("Unauthorized request, please login again", 401);
        }

        // Check if old password is correct
        if (!(await user.isPasswordCorrect(oldPassword))) {
            throw new ApiError("Old password is incorrect", 400);
        }

        // Update user password
        user.password = newPassword;
        await user.save();

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Password changed successfully", {}));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: changePassword :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const updateProfile = asyncHandler(async (req, res, next) => {
    try {
        // Get details from request
        const {
            name,
            country,
            state,
            city,
            pincode,
            address_line_1,
            address_line_2
        } = req.body;

        // Update user details
        await User.findByIdAndUpdate(
            req.user._id,
            {
                name: name || req.user.name,
                address: {
                    country: country || req.user.address.country,
                    state: state || req.user.address.state,
                    city: city || req.user.address.city,
                    pincode: pincode || req.user.address.pincode,
                    address_line_1:
                        address_line_1 || req.user.address.address_line_1,
                    address_line_2:
                        address_line_2 || req.user.address.address_line_2
                }
            },
            { new: true }
        );

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Profile updated successfully", {}));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: updateProfile :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const refreshAccessToken = asyncHandler(async (req, res, next) => {
    try {
        // Get refresh token from cookie
        const oldRefreshToken = req.cookies?.refreshToken;
        if (!oldRefreshToken) {
            throw new ApiError("Unauthorized request, please login again", 401);
        }

        // Check if refresh token is valid
        const decodedToken = jwt.verify(
            oldRefreshToken,
            constants.REFRESH_TOKEN_SECRET
        );
        if (!decodedToken?._id) {
            throw new ApiError("User not found", 401);
        }

        // Get refresh token from database
        const user = await User.findById(decodedToken._id).select(
            "_id role refreshToken"
        );

        // Check if refresh token matches with database
        if (user.refreshToken !== oldRefreshToken) {
            throw new ApiError("Invalid token", 401);
        }

        // Generate new tokens
        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user);
        const cookieOptions = {
            httpOnly: true,
            secure: true
        };

        // Send response
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse("Access token refreshed successfully", {}));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: refreshAccessToken :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const deleteUser = asyncHandler(async (req, res, next) => {
    try {
        // Get user from request
        const user = await User.findById(req.user._id);

        // Delete user's avatar
        const result = await deleteImage(user.avatar.public_id);
        if (!result) {
            throw new ApiError("Error deleting avatar", 400);
        }

        // Delete user
        await User.findByIdAndDelete(user._id);

        // Send response
        return res
            .status(200)
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .json(new ApiResponse("User deleted successfully", {}));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: deleteUser :: ${error}`,
                error.statusCode
            )
        );
    }
});
