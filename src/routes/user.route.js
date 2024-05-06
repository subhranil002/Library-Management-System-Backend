import { Router } from "express";
import {
    changeAvatar,
    changePassword,
    deleteUser,
    fetchFineDetails,
    getBorrowedBooks,
    getCurrentUser,
    getFineDetails,
    login,
    logout,
    refreshAccessToken,
    register,
    updateProfile
} from "../controllers/user.controller.js";
import { authorizedRoles, isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const userRouter = Router();

// Routes
userRouter.route("/register").post(register);
userRouter.route("/login").post(login);
userRouter.route("/logout").get(isLoggedIn, logout);
userRouter.route("/current-user").get(isLoggedIn, getCurrentUser);
userRouter
    .route("/change-avatar")
    .put(upload.single("avatar"), isLoggedIn, changeAvatar);
userRouter.route("/change-password").put(isLoggedIn, changePassword);
userRouter
    .route("/update-profile")
    .put(isLoggedIn, authorizedRoles("LIBRARIAN", "ADMIN"), updateProfile);
userRouter.route("/refresh-token").get(refreshAccessToken);
userRouter.route("/delete-user").delete(isLoggedIn, deleteUser);
userRouter.route("/borrowed-books").get(isLoggedIn, getBorrowedBooks);
userRouter.route("/fines").get(isLoggedIn, getFineDetails);
userRouter
    .route("/fines")
    .post(isLoggedIn, authorizedRoles("LIBRARIAN", "ADMIN"), fetchFineDetails);

export default userRouter;
