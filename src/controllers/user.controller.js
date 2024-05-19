import { User } from "../models/user.model.js";
import { BookTransaction } from "../models/bookTransaction.model.js";
import { Fine } from "../models/fine.model.js";
import { Otp } from "../models/otp.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateAccessAndRefreshToken from "../utils/generateTokens.js";
import {
    deleteLocalFiles,
    uploadImage,
    deleteImage
} from "../utils/fileHandler.js";
import jwt from "jsonwebtoken";
import constants from "../constants.js";
import { isBefore } from "date-fns";
import { sendEmail, validateEmail } from "../utils/sendMail.js";

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
        if (!validateEmail(email)) {
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
        } else if (role === "LIBRARIAN" && req.user.role !== "ADMIN") {
            throw new ApiError("Librarian can only be created by admin", 400);
        } else if (role === "ADMIN" && req.user.role !== "ADMIN") {
            throw new ApiError("Admin can only be created by admin", 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });
        if (existingUser) {
            throw new ApiError(`${role ? role : "User"} already exists`, 400);
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
            throw new ApiError(`${role ? role : "User"} not created`, 400);
        }

        // Send response
        return res
            .status(200)
            .json(new ApiResponse(`${user.role} created successfully`, {}));
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
        if (!validateEmail(email)) {
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

export const sendOTP = asyncHandler(async (req, res, next) => {
    try {
        // Get email
        const { email } = req.body;

        // Validate input
        if (!email) {
            throw new ApiError("Email is required", 400);
        }

        // Validate email format
        if (!validateEmail(email)) {
            throw new ApiError("Invalid email", 400);
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError("User not found", 404);
        } else if (user.verified) {
            throw new ApiError("User already verified", 400);
        }

        // Check role of user
        if (user.role === "LIBRARIAN" && req.user.role !== "ADMIN") {
            throw new ApiError("Only admin can verify librarian", 400);
        } else if (user.role === "ADMIN" && req.user.role !== "ADMIN") {
            throw new ApiError("Only admin can verify admin", 400);
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Save or update OTP record
        await Otp.findOneAndUpdate({ email }, { email, otp }, { upsert: true });

        // Send OTP
        const subject = `Your OTP - ${otp} `;
        const html = `
            <h4>Dear User,</h4>
            <p>Your OTP for TheOpenPage is <strong style="color: #007bff;">${otp}</strong></p>
            <p>Please use this OTP to complete your user verification on TheOpenPage. Please note that this OTP is valid for a single use and should not be shared with anyone else.</p>
            <p>If you did not request this OTP or have any concerns about the security of your account, please reach out to our support team immediately at theopenpage.subhranil@gmail.com</p>
        `;
        const response = await sendEmail(email, subject, html);

        // If OTP not sent
        if (!response) {
            throw new ApiError("Failed to send OTP", 400);
        }

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("OTP sent successfully", {}));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: sendOTP :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const verifyOTP = asyncHandler(async (req, res, next) => {
    try {
        // Get OTP and email from request
        const { otp, email } = req.body;

        // Check if OTP and email are valid
        if (!otp || !email) {
            throw new ApiError("All fields are required", 400);
        }
        if (!validateEmail(email)) {
            throw new ApiError("Invalid email format", 400);
        }
        if (otp.length < 6) {
            throw new ApiError("OTP must be at least 6 characters", 400);
        }

        // Get user from database
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError("User not found", 404);
        }

        // Check role of user
        if (user.role === "LIBRARIAN" && req.user.role !== "ADMIN") {
            throw new ApiError("Only admin can verify librarian", 400);
        } else if (user.role === "ADMIN" && req.user.role !== "ADMIN") {
            throw new ApiError("Only admin can verify admin", 400);
        }

        // Check if OTP is valid
        const otpRecord = await Otp.findOne({ email, otp });
        if (!otpRecord) {
            throw new ApiError("Invalid OTP", 400);
        }

        // Delete OTP record
        await Otp.findByIdAndDelete(otpRecord._id);

        // Verify user
        user.verified = true;
        await user.save();

        // Send response
        return res
            .status(200)
            .json(new ApiResponse(`${user.role} verified successfully`, {}));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: verifyOTP :: ${error}`,
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
            email,
            name,
            phone,
            country,
            state,
            city,
            pincode,
            address_line_1,
            address_line_2
        } = req.body;

        // Validate fields
        if (!email) {
            throw new ApiError("Email is required", 400);
        }
        if (
            !name &&
            !phone &&
            !country &&
            !state &&
            !city &&
            !pincode &&
            !address_line_1 &&
            !address_line_2
        ) {
            throw new ApiError("At least one field is required to update", 400);
        }
        if (!validateEmail(email)) {
            throw new ApiError("Invalid email format", 400);
        }
        if (phone && !/^(\+91[\-\s]?)?[0]?[6-9]\d{9}$/.test(phone)) {
            throw new ApiError("Invalid phone number format", 400);
        }

        // Check if phone exists
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            throw new ApiError("Phone number already exists", 400);
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError("User not found", 404);
        }

        // Update user details
        await User.findOneAndUpdate(
            { email },
            {
                name: name || user.name,
                phone: phone || user.phone,
                address: {
                    country: country || user.address.country,
                    state: state || user.address.state,
                    city: city || user.address.city,
                    pincode: pincode || user.address.pincode,
                    address_line_1:
                        address_line_1 || user.address.address_line_1,
                    address_line_2:
                        address_line_2 || user.address.address_line_2
                }
            },
            {
                new: true
            }
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
        // Get email from request
        const { email } = req.body;

        // Check if email is valid
        if (!email) {
            throw new ApiError("Email is required", 400);
        }
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            throw new ApiError("Invalid email format", 400);
        }

        // Get user from database
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError("User not found", 404);
        }

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
            .json(new ApiResponse(`${user.role} deleted successfully`, {}));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: deleteUser :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const getBorrowedBooks = asyncHandler(async (req, res, next) => {
    try {
        // Get bowrrowed books
        const books = await BookTransaction.find({
            "borrowedBy._id": req.user._id,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });

        // Check if books exist
        if (!books.length) {
            return res.status(200).json(new ApiResponse("No books found", {}));
        }

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Books fetched successfully", books));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: getBorrowedBooks :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const fetchBorrowedBooks = asyncHandler(async (req, res, next) => {
    try {
        // Get user email from request
        const { email } = req.body;

        // Check if email is valid
        if (!email) {
            throw new ApiError("Email is required", 400);
        }
        if (!validateEmail(email)) {
            throw new ApiError("Invalid email format", 400);
        }

        // Get bowrrowed books
        const books = await BookTransaction.find({
            "borrowedBy.email": email,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });

        // Check if books exist
        if (!books.length) {
            return res.status(200).json(new ApiResponse("No books found", {}));
        }

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Books fetched successfully", books));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: getBorrowedBooks :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const getFinedBooks = asyncHandler(async (req, res, next) => {
    try {
        // Get user transactions
        const userTransactions = await BookTransaction.find({
            "borrowedBy._id": req.user._id,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });

        // Check if user transactions exist
        if (!userTransactions.length) {
            return res
                .status(200)
                .json(new ApiResponse("No transactions found", {}));
        }

        // Check if any of the transactions are fined
        for (const transaction of userTransactions) {
            if (transaction.status === "PENDING") {
                const overdue = isBefore(transaction.returnDate, new Date());
                if (overdue) {
                    console.log(transaction);
                    transaction.status = "FINED";
                    await transaction.save();
                }
            }
        }

        // Get fined transactions
        const finedTransactions = userTransactions.filter(
            transaction => transaction.status === "FINED"
        );

        // Check if fined transaction exists
        if (!finedTransactions.length) {
            return res.status(200).json(new ApiResponse("No fines found", {}));
        }

        // Send response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    "Fined books fetched successfully",
                    finedTransactions
                )
            );
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: getFineDetails :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const fetchFinedBooks = asyncHandler(async (req, res, next) => {
    try {
        // Get user email
        const { email } = req.body;

        // Check if email is valid
        if (!email) {
            throw new ApiError("Email is required", 400);
        }
        if (!validateEmail(email)) {
            throw new ApiError("Invalid email format", 400);
        }

        // Get user transactions
        const userTransactions = await BookTransaction.find({
            "borrowedBy.email": email,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });

        // Check if user transactions exist
        if (!userTransactions.length) {
            return res
                .status(200)
                .json(new ApiResponse("No transactions found", {}));
        }

        // Check if any of the transactions are fined
        for (const transaction of userTransactions) {
            if (transaction.status === "PENDING") {
                const overdue = isBefore(transaction.returnDate, new Date());
                if (overdue) {
                    console.log(transaction);
                    transaction.status = "FINED";
                    await transaction.save();
                }
            }
        }

        // Get fined transactions
        const finedTransactions = userTransactions.filter(
            transaction => transaction.status === "FINED"
        );

        // Check if fined transaction exists
        if (!finedTransactions.length) {
            return res.status(200).json(new ApiResponse("No fines found", {}));
        }

        // Send response
        return res
            .status(200)
            .json(
                new ApiResponse("Fines fetched successfully", finedTransactions)
            );
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: getFineDetails :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const getFine = asyncHandler(async (req, res, next) => {
    try {
        // get book details from params
        const { bookCode } = req.params;

        // check if book code is valid
        if (!bookCode) {
            throw new ApiError("Book code is required", 400);
        }

        // get fine details from database
        const fine = await Fine.findOne({
            "transaction.book.bookCode": bookCode,
            "transaction.borrowedBy._id": req.user._id,
            status: "CREATED"
        });

        // check if fine details not exist
        if (!fine) {
            throw new ApiError("Fine not found", 400);
        }

        // send response
        return res
            .status(200)
            .json(new ApiResponse("Fine fetched successfully", fine));
    } catch (error) {
        return next(
            new ApiError(
                `user.controller :: getFine :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const searchUser = asyncHandler(async (req, res, next) => {});

export const fetchUserDetails = asyncHandler(async (req, res, next) => {});