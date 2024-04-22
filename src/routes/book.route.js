import { Router } from "express";
import { addBook } from "../controllers/book.controller.js";
import { isLoggedIn, authorizedRoles } from "../middlewares/auth.middleware.js";

const bookRouter = Router();

// Routes
bookRouter
    .route("/add-book")
    .post(isLoggedIn, authorizedRoles("LIBRARIAN", "ADMIN"), addBook);

export default bookRouter;
