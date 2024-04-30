import { Book } from "../models/book.model.js";
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
        if (title.length > 50 || subtitle.length > 50) {
            throw new ApiError(
                "Title or subtitle must be at most 50 characters",
                400
            );
        }
        if (author.length > 50) {
            throw new ApiError("Author must be at most 50 characters", 400);
        }
        if (publisher.length > 50) {
            throw new ApiError("Publisher must be at most 50 characters", 400);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedDate)) {
            throw new ApiError(
                "Invalid publishedDate format. Expected YYYY-MM-DD",
                400
            );
        }
        if (new Date(publishedDate) > new Date()) {
            throw new ApiError("Published date cannot be in future", 400);
        }
        if (description.length > 1000) {
            throw new ApiError(
                "Description must be at most 1000 characters",
                400
            );
        }
        if (genre.length > 3) {
            throw new ApiError("Maximum 3 genres allowed", 400);
        } else {
            genre.map(genre => {
                if (
                    genre !== "FICTION" &&
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
                    genre !== "COMEDY" &&
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
                    genre !== "CHILDREN'S"
                ) {
                    throw new ApiError(`Invalid genre: ${genre}`, 400);
                }
            });
        }
        if (isbn10.length !== 10 || isbn13.length !== 13) {
            throw new ApiError(
                "ISBN-10 must be exactly 10 characters and ISBN-13 must be exactly 13 characters",
                400
            );
        }
        if (pageCount <= 0) {
            throw new ApiError("Page count must be a positive integer", 400);
        }

        // Check if book already exists
        const isExists = await Book.findOne({ bookCode });
        if (isExists) {
            throw new ApiError("Book with this bookCode already exists", 400);
        }

        // Add book to database
        const newBook = await Book.create({
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

export const getBook = asyncHandler(async (req, res, next) => {
    try {
        // Get book details from request
        const bookCode = req.params.bookCode;

        // Validate request data
        if (!bookCode) {
            throw new ApiError("Book code is required", 400);
        }

        // Check if book exists
        const book = await Book.findOne({ bookCode });
        if (!book) {
            throw new ApiError("Book not found", 404);
        }

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Book fetched successfully", book));
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: getBook :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const searchBook = asyncHandler(async (req, res, next) => {
    try {
        // Get search query from request
        const query = req.query.query;

        // Validate request data
        if (!query) {
            throw new ApiError("Search query is required", 400);
        }

        // Search book
        const books = await Book.aggregate([
            {
                $match: {
                    $or: [
                        {
                            "volumeInfo.title": { $regex: query, $options: "i" }
                        },
                        {
                            "volumeInfo.author": {
                                $regex: query,
                                $options: "i"
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        isbn10: "$industryIdentifiers.isbn10",
                        isbn13: "$industryIdentifiers.isbn13"
                    },
                    book: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$book" }
            }
        ]);

        // Handle empty search results
        if (books.length === 0) {
            return res.status(200).json(new ApiResponse("No books found", {}));
        }

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Books fetched successfully", books));
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: searchBook :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const changeThumbnail = asyncHandler(async (req, res, next) => {
    try {
        // Get book thumbnail from request
        const bookThumbnailPath = req.file ? req.file.path : "";

        // Validate request data
        if (!bookThumbnailPath) {
            throw new ApiError("Book thumbnail is required", 400);
        }

        // Get book details from request
        const bookCode = req.params.bookCode;

        // Validate request data
        if (!bookCode) {
            deleteLocalFiles([bookThumbnailPath]);
            throw new ApiError("Book code is required", 400);
        }

        // Check if book exists
        const book = await Book.findOne({ bookCode });
        if (!book) {
            deleteLocalFiles([bookThumbnailPath]);
            throw new ApiError("Book not found", 400);
        }

        // Upload new thumbnail to Cloudinary
        const newThumbnail = await uploadImage(bookThumbnailPath);
        if (!newThumbnail.public_id || !newThumbnail.secure_url) {
            deleteLocalFiles([bookThumbnailPath]);
            throw new ApiError("Error uploading thumbnail", 400);
        }

        // Delete old thumbnail
        const result = await deleteImage(book.thumbnail.public_id);
        if (!result) {
            deleteImage(newThumbnail.public_id);
            throw new ApiError("Error deleting old avatar", 400);
        }

        // Update thumbnail
        book.thumbnail = newThumbnail;
        await book.save();

        // Send response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    "Book thumbnail changed successfully",
                    book.thumbnail
                )
            );
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: changeThumbnail :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const deleteBook = asyncHandler(async (req, res, next) => {
    try {
        // Get book details from request
        const bookCode = req.params.bookCode;

        // Validate request data
        if (!bookCode) {
            throw new ApiError("Book code is required", 400);
        }

        // Check if book exists
        const book = await Book.findOne({ bookCode });
        if (!book) {
            throw new ApiError("Book not found", 400);
        }

        // Delete book thumbnail
        const result = await deleteImage(book.thumbnail.public_id);
        if (!result) {
            throw new ApiError("Error deleting thumbnail", 400);
        }

        // Delete book
        await Book.findByIdAndDelete(book._id);

        // Send response
        return res
            .status(200)
            .json(new ApiResponse(`Book ${bookCode} deleted successfully`, {}));
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: deleteBook :: ${error}`,
                error.statusCode
            )
        );
    }
});
