import { Router } from "express";
import {
    changeAvatar,
    changePassword,
    deleteUser,
    fetchBorrowedBooks,
    fetchFinedBooks,
    fetchUserDetails,
    getBorrowedBooks,
    getCurrentUser,
    getFine,
    getFinedBooks,
    login,
    logout,
    refreshAccessToken,
    register,
    searchUsers,
    sendOTP,
    updateProfile,
    verifyOTP
} from "../../controllers/user.controller.js";
import {
    authorizedRoles,
    isLoggedIn,
    isVerified
} from "../../middlewares/auth.middleware.js";
import { upload, rateLimiter, cacheMiddleware } from "../../middlewares/index.js";

const userRouter = Router();

// Rate limiters for sensitive routes
// ... existing limiters ...

const generateUserSummaryCacheKey = (req) => `user:summary:${req.user._id}`;

// Rate limiters for sensitive routes
const loginLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxLimit: 5,
    message: "Too many login attempts. Please try again after 15 minutes."
});

const otpLimiter = rateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxLimit: 3,
    message: "Too many OTP requests. Please try again after 10 minutes."
});

const verifyOtpLimiter = rateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxLimit: 5,
    message: "Too many verification attempts. Please try again after 10 minutes."
});

// Routes
userRouter
    .route("/register")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        register
    );

userRouter.route("/login").post(loginLimiter, login);

userRouter.route("/logout").get(isLoggedIn, logout);

userRouter
    .route("/send-otp")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        otpLimiter,
        sendOTP
    );

userRouter
    .route("/verify-otp")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        verifyOtpLimiter,
        verifyOTP
    );

userRouter.route("/current-user").get(isLoggedIn, cacheMiddleware(generateUserSummaryCacheKey), getCurrentUser);

userRouter
    .route("/change-avatar")
    .put(upload.single("avatar"), isLoggedIn, changeAvatar);

userRouter.route("/change-password").put(isLoggedIn, changePassword);

userRouter
    .route("/update-profile")
    .put(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        updateProfile
    );

userRouter.route("/refresh-token").get(refreshAccessToken);

userRouter
    .route("/delete-user")
    .delete(isLoggedIn, isVerified, authorizedRoles("ADMIN"), deleteUser);

userRouter
    .route("/borrowed-books")
    .get(isLoggedIn, isVerified, getBorrowedBooks)
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        fetchBorrowedBooks
    );

userRouter
    .route("/fined-books")
    .get(isLoggedIn, isVerified, getFinedBooks)
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        fetchFinedBooks
    );

userRouter.route("/fine/:bookCode").get(isLoggedIn, isVerified, getFine);

userRouter
    .route("/search")
    .get(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        searchUsers
    );

userRouter
    .route("/fetch-user")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        fetchUserDetails
    );

export default userRouter;
