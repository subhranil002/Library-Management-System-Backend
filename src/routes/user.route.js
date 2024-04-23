import { Router } from "express";
import {
    changeAvatar,
    changePassword,
    deleteUser,
    getCurrentUser,
    login,
    logout,
    refreshAccessToken,
    register,
    updateProfile
} from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
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
userRouter.route("/update-profile").put(isLoggedIn, updateProfile);
userRouter.route("/refresh-token").get(refreshAccessToken);
userRouter.route("/delete-user").delete(isLoggedIn, deleteUser);

export default userRouter;
