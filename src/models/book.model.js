import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
    {
        volumeInfo: {
            title: {
                type: String,
                required: [true, "Title is required"],
                trim: true,
                maxlength: [50, "Title must be less than 50 characters"]
            },
            subtitle: {
                type: String,
                trim: true,
                maxlength: [50, "Subtitle must be less than 50 characters"]
            },
            author: {
                type: String,
                required: [true, "Author is required"],
                trim: true,
                maxlength: [50, "Author must be less than 50 characters"]
            }
        },
        publisher: {
            type: String,
            required: [true, "Publisher is required"],
            trim: true,
            maxlength: [50, "Publisher must be less than 50 characters"]
        },
        publishedDate: {
            type: Date,
            required: [true, "Published date is required"],
            trim: true
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: [500, "Description must be less than 500 characters"]
        },
        Genre: {
            type: String,
            required: [true, "Genre is required"],
            enum: ["FICTION", "NON-FICTION", "MAGAZINE", "NEWSPAPER", "PERIODICAL", "REFERENCE", "EDUCATION/TEXTBOOKS", "RELIGION/SPIRITUALITY", "MYSTERY/THRILLER", "FANTASY", "ROMANCE", "HORROR", "ADVENTURE", "BIOGRAPHY/AUTOBIOGRAPHY", "HISTORY", "SELF-HELP", "COOKING/FOOD", "TRAVEL", "COMICS/GRAPHIC NOVELS", "DRAMA", "POETRY", "CHILDREN'S"],
        },
        industryIdentifiers: {
            isbn10: {
                type: String,
                trim: true,
                required: [true, "ISBN-10 is required"],
                maxlength: [10, "ISBN-10 must be less than 10 characters"]
            },
            isbn13: {
                type: String,
                trim: true,
                required: [true, "ISBN-13 is required"],
                maxlength: [13, "ISBN-13 must be less than 13 characters"]
            }
        },
        pageCount: {
            type: Number,
            required: [true, "Page count is required"],
            trim: true
        },
        thumbnail: {
            public_id: {
                type: String,
                trim: true,
                required: [true, "Public ID is required"]
            },
            secure_url: {
                type: String,
                trim: true,
                required: [true, "Secure URL is required"]
            }
        },
        issueHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "BookTransaction"
            }
        ],
    },
    {
        timestamps: true
    }
);

export const Book = mongoose.model("Book", bookSchema);
