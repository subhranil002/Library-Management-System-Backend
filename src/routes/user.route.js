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
} from "../controllers/user.controller.js";
import {
    authorizedRoles,
    isLoggedIn,
    isVerified
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const userRouter = Router();

// Routes
userRouter
    .route("/register")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        register
    );

userRouter.route("/login").post(login);

userRouter.route("/logout").get(isLoggedIn, logout);

userRouter
    .route("/send-otp")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        sendOTP
    );

userRouter
    .route("/verify-otp")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        verifyOTP
    );

userRouter.route("/current-user").get(isLoggedIn, getCurrentUser);

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
