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
} from "../../controllers/book.controller.js";
import {
    isLoggedIn,
    authorizedRoles,
    isVerified
} from "../../middlewares/auth.middleware.js";
import { upload, rateLimiter, cacheMiddleware } from "../../middlewares/index.js";

const bookRouter = Router();

const searchLimiter = rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxLimit: 20,
    message: "Too many search requests. Please try again later."
});

// Cache key generators
const generateSearchCacheKey = (req) => `search:books:${req.query.query || ""}:${req.query.genre || ""}`;
const generateBookDetailsCacheKey = (req) => `book:isbn:${req.params.isbn13}`;

// Routes
bookRouter
    .route("/add-book")
    .post(
        isLoggedIn,
        isVerified,
        authorizedRoles("LIBRARIAN", "ADMIN"),
        addBook
    );

bookRouter.route("/search-books").get(searchLimiter, cacheMiddleware(generateSearchCacheKey), searchBooks);

bookRouter.route("/get-book/:isbn13").get(cacheMiddleware(generateBookDetailsCacheKey), getBookDetails);

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
