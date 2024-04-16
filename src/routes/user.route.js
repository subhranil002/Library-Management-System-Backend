import { Router } from "express";
import { login, logout, register } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// Routes
userRouter.route("/register").post(register);
userRouter.route("/login").post(login);
userRouter.route("/logout").post(isLoggedIn, logout);

export default userRouter;
