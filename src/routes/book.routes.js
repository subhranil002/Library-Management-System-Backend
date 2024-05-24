import { Router } from "express";
import {
    addBook,
    changeThumbnail,
    deleteBook,
    forceReturnBook,
    getBookDetails,
    issueBook,
    returnBook,
    searchBooks
} from "../controllers/book.controller.js";
import {
    isLoggedIn,
    authorizedRoles,
    isVerified
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const bookRouter = Router();

// Routes
bookRouter
    .route("/add-book")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        addBook
    );

bookRouter.route("/search-books").get(searchBooks);

bookRouter.route("/get-book/:isbn13").get(getBookDetails);

bookRouter
    .route("/change-thumbnail/:bookCode")
    .put(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        upload.single("thumbnail"),
        changeThumbnail
    );

bookRouter
    .route("/delete-book/:bookCode")
    .delete(isLoggedIn, isVerified, authorizedRoles("ADMIN"), deleteBook);

bookRouter
    .route("/issue-book")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        issueBook
    );

bookRouter
    .route("/return-book/:bookCode")
    .get(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        returnBook
    );

bookRouter
    .route("/force-return-book/:bookCode")
    .get(isLoggedIn, isVerified, authorizedRoles("ADMIN"), forceReturnBook);

export default bookRouter;
