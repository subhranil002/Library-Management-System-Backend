import { Book } from "../models/book.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    deleteLocalFiles,
    uploadImage,
    deleteImage
} from "../utils/fileHandler.js";

export const addBook = asyncHandler(async (req, res, next) => {
    try {
        // Get book details from request
        const {
            bookCode,
            title,
            subtitle,
            author,
            publisher,
            publishedDate,
            description,
            genre,
            isbn10,
            isbn13,
            pageCount
        } = req.body;

        // Validate request data
        if (
            !bookCode ||
            !title ||
            !author ||
            !publisher ||
            !publishedDate ||
            !description ||
            !genre ||
            !isbn10 ||
            !isbn13 ||
            !pageCount
        ) {
            throw new ApiError("All fields are required", 400);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedDate)) {
            throw new ApiError("Invalid publishedDate format", 400);
        }
        if (new Date(publishedDate) > new Date()) {
            throw new ApiError("Published date cannot be in future", 400);
        }
        if (
            !genre ||
            (genre !== "FICTION" &&
                genre !== "NON-FICTION" &&
                genre !== "MAGAZINE" &&
                genre !== "NEWSPAPER" &&
                genre !== "PERIODICAL" &&
                genre !== "REFERENCE" &&
                genre !== "EDUCATION/TEXTBOOKS" &&
                genre !== "RELIGION/SPIRITUALITY" &&
                genre !== "MYSTERY/THRILLER" &&
                genre !== "FANTASY" &&
                genre !== "ROMANCE" &&
                genre !== "HORROR" &&
                genre !== "ADVENTURE" &&
                genre !== "BIOGRAPHY/AUTOBIOGRAPHY" &&
                genre !== "HISTORY" &&
                genre !== "SELF-HELP" &&
                genre !== "COOKING/FOOD" &&
                genre !== "TRAVEL" &&
                genre !== "COMICS/GRAPHIC NOVELS" &&
                genre !== "DRAMA" &&
                genre !== "POETRY" &&
                genre !== "CHILDREN'S")
        ) {
            throw new ApiError("Invalid genre", 400);
        }

        // Check if book already exists
        const isExists = await Book.findOne({ bookCode });
        if (isExists) {
            throw new ApiError("Book already exists", 400);
        }

        // Add book to database
        const newBook = Book.create({
            bookCode,
            volumeInfo: {
                title,
                subtitle,
                author
            },
            publisher,
            publishedDate,
            description,
            genre,
            industryIdentifiers: {
                isbn10,
                isbn13
            },
            pageCount
        });

        // Check if book created successfully
        const book = await Book.findById(newBook._id);
        if (!book) {
            throw new ApiError("Book not created", 400);
        }

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Book created successfully", book));
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: addBook :: ${error}`,
                error.statusCode
            )
        );
    }
});
