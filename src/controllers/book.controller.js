import { Book } from "../models/book.model.js";
import { BookTransaction } from "../models/bookTransaction.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    deleteLocalFiles,
    uploadImage,
    deleteImage
} from "../utils/fileHandler.js";
import { addDays, isBefore, endOfDay } from "date-fns";

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

export const searchBooks = asyncHandler(async (req, res, next) => {
    try {
        // Get search query from request
        const query = req.query.query;
        const genre = req.query.genre;

        // Validate request data
        if (!query && !genre) {
            throw new ApiError("Search query or genre is required", 400);
        }
        if (
            genre &&
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

        // Create pipeline
        const pipeline = [];
        if (genre) {
            pipeline.push({
                $match: {
                    genre: genre
                }
            });
        }
        if (query) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            "volumeInfo.title": {
                                $regex: query,
                                $options: "i"
                            }
                        },
                        {
                            "volumeInfo.subtitle": {
                                $regex: query,
                                $options: "i"
                            }
                        },
                        {
                            "volumeInfo.author": {
                                $regex: query,
                                $options: "i"
                            }
                        }
                    ]
                }
            });
        }
        pipeline.push(
            {
                $group: {
                    _id: "$industryIdentifiers.isbn13",
                    uniqueBook: {
                        $first: "$$ROOT"
                    }
                }
            },
            {
                $project: {
                    volumeInfo: "$uniqueBook.volumeInfo",
                    publisher: "$uniqueBook.publisher",
                    publishedDate: "$uniqueBook.publishedDate",
                    genre: "$uniqueBook.genre",
                    thumbnail: "$uniqueBook.thumbnail",
                    industryIdentifiers: "$uniqueBook.industryIdentifiers"
                }
            }
        );

        // Search book
        const books = await Book.aggregate(pipeline);

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

export const getBookDetails = asyncHandler(async (req, res, next) => {
    try {
        // Get book details from request
        const isbn13 = req.params.isbn13;

        // Validate request data
        if (!isbn13) {
            throw new ApiError("Book code is required", 400);
        }

        // Check if book exists
        const book = await Book.findOne({
            "industryIdentifiers.isbn13": isbn13
        });
        if (!book) {
            throw new ApiError("Book not found", 404);
        }

        // Get book details
        const bookDetails = await Book.aggregate([
            {
                $match: {
                    "industryIdentifiers.isbn13":
                        book.industryIdentifiers.isbn13
                }
            },
            {
                $group: {
                    _id: null,
                    bookCodes: { $addToSet: "$bookCode" },
                    totalBooks: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "booktransactions",
                    localField: "bookCodes",
                    foreignField: "book.bookCode",
                    as: "transactions"
                }
            },
            {
                $addFields: {
                    issuedBookCodes: {
                        $map: {
                            input: {
                                $filter: {
                                    input: "$transactions",
                                    as: "transaction",
                                    cond: {
                                        $ne: [
                                            "$$transaction.status",
                                            "RETURNED"
                                        ]
                                    }
                                }
                            },
                            as: "transaction",
                            in: "$$transaction.book.bookCode"
                        }
                    }
                }
            },
            {
                $addFields: {
                    stock: {
                        $subtract: [
                            { $size: "$bookCodes" },
                            { $size: "$issuedBookCodes" }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "books",
                    localField: "bookCodes",
                    foreignField: "bookCode",
                    as: "bookDetails"
                }
            },
            {
                $project: {
                    _id: 0,
                    volumeInfo: {
                        $arrayElemAt: ["$bookDetails.volumeInfo", 0]
                    },
                    publisher: { $arrayElemAt: ["$bookDetails.publisher", 0] },
                    publishedDate: {
                        $arrayElemAt: ["$bookDetails.publishedDate", 0]
                    },
                    description: {
                        $arrayElemAt: ["$bookDetails.description", 0]
                    },
                    genre: { $arrayElemAt: ["$bookDetails.genre", 0] },
                    industryIdentifiers: {
                        $arrayElemAt: ["$bookDetails.industryIdentifiers", 0]
                    },
                    pageCount: { $arrayElemAt: ["$bookDetails.pageCount", 0] },
                    thumbnail: { $arrayElemAt: ["$bookDetails.thumbnail", 0] },
                    holding: {
                        total: "$totalBooks",
                        stock: "$stock"
                    }
                }
            }
        ]);

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Book fetched successfully", bookDetails));
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: getBook :: ${error}`,
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

export const issueBook = asyncHandler(async (req, res, next) => {
    try {
        // Get issue details from request
        const { bookCode, borrowerEmail } = req.body;

        // Validate request data
        if (!bookCode || !borrowerEmail) {
            throw new ApiError("All fields are required", 400);
        }

        // Check if book exists
        const book = await Book.findOne({ bookCode });
        if (!book) {
            throw new ApiError("Book not found", 400);
        }

        // Check if book is not issued
        const isIssued = await BookTransaction.findOne({
            "book._id": book._id,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });
        if (isIssued) {
            throw new ApiError("Book already issued", 400);
        }

        // Check if verified borrower exists
        const borrower = await User.findOne({
            email: borrowerEmail,
            verified: true
        });
        if (!borrower) {
            throw new ApiError("Borrower is not verified", 400);
        }

        // Check if borrower is fined
        const bookTransaction = await BookTransaction.find({
            "borrowedBy._id": borrower._id,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });
        for (const transaction of bookTransaction) {
            if (transaction.status === "PENDING") {
                const overdue = isBefore(transaction.returnDate, new Date());
                if (overdue) {
                    console.log(transaction);
                    transaction.status = "FINED";
                    await transaction.save();
                    throw new ApiError("Return overdue", 400);
                }
            } else if (transaction.status === "FINED") {
                throw new ApiError("Borrower is fined", 400);
            }
        }

        // Check if borrower already borrowed more than 4 books
        if (bookTransaction.length == 4) {
            throw new ApiError("Maximum 4 books can be borrowed", 400);
        }

        // Check if borrower has same copy of book
        const isSameBook = await BookTransaction.findOne({
            "borrowedBy._id": borrower._id,
            "book.industryIdentifiers.isbn13": book.industryIdentifiers.isbn13,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });
        if (isSameBook) {
            throw new ApiError("Borrower already has same copy of book", 400);
        }

        // Issue book
        const returnDate = endOfDay(addDays(new Date(), 30));
        const newBookTransaction = await BookTransaction.create({
            book: book,
            bookCode,
            borrowedBy: borrower,
            issuedBy: req.user,
            returnDate
        });

        // Send response
        return res
            .status(200)
            .json(
                new ApiResponse("Book issued successfully", newBookTransaction)
            );
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: issueBook :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const returnBook = asyncHandler(async (req, res, next) => {
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

        // Check if book is not returned
        const isPending = await BookTransaction.findOne({
            "book._id": book._id,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });
        if (!isPending) {
            throw new ApiError("Book already returned", 400);
        }

        // Check for overdue return
        if (isPending.status === "PENDING") {
            const overdue = isBefore(isPending.returnDate, new Date());
            if (overdue) {
                isPending.status = "FINED";
                await isPending.save();
                throw new ApiError("Return overdue", 400);
            }
        }

        // Check if borrower is fined
        if (isPending.status === "FINED") {
            throw new ApiError("Borrower is fined", 400);
        }

        // Return book
        isPending.status = "RETURNED";
        await isPending.save();

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Book returned successfully", isPending));
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: returnBook :: ${error}`,
                error.statusCode
            )
        );
    }
});

export const forceReturnBook = asyncHandler(async (req, res, next) => {
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

        // Check if book is not returned
        const isPending = await BookTransaction.findOne({
            "book._id": book._id,
            status: {
                $in: ["PENDING", "FINED"]
            }
        });
        if (!isPending) {
            throw new ApiError("Book already returned", 400);
        }

        // Return book
        isPending.status = "RETURNED";
        await isPending.save();

        // Send response
        return res
            .status(200)
            .json(new ApiResponse("Book returned successfully", isPending));
    } catch (error) {
        return next(
            new ApiError(
                `book.controller :: forceReturnBook :: ${error}`,
                error.statusCode
            )
        );
    }
});
