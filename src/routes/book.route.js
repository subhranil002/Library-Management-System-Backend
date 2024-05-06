import { Router } from "express";
import {
    addBook,
    changeThumbnail,
    deleteBook,
    getBook,
    issueBook,
    returnBook,
    searchBooks
} from "../controllers/book.controller.js";
import { isLoggedIn, authorizedRoles } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const bookRouter = Router();

// Routes
bookRouter
    .route("/add-book")
    .post(isLoggedIn, authorizedRoles("LIBRARIAN", "ADMIN"), addBook);
bookRouter.route("/get-book/:bookCode").get(getBook);
bookRouter.route("/search-books").get(searchBooks);
bookRouter
    .route("/change-thumbnail/:bookCode")
    .put(
        isLoggedIn,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        upload.single("thumbnail"),
        changeThumbnail
    );
bookRouter
    .route("/delete-book/:bookCode")
    .delete(isLoggedIn, authorizedRoles("ADMIN"), deleteBook);
bookRouter
    .route("/issue-book")
    .post(isLoggedIn, authorizedRoles("LIBRARIAN", "ADMIN"), issueBook);
bookRouter
    .route("/return-book/:bookCode")
    .get(isLoggedIn, authorizedRoles("LIBRARIAN", "ADMIN"), returnBook);

export default bookRouter;
