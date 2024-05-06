import mongoose from "mongoose";

const bookTransactionSchema = new mongoose.Schema(
    {
        book: {
            _id: {
                type: String,
                required: [true, "Book id is required"],
                trim: true
            },
            bookCode: {
                type: String,
                required: [true, "Book code is required"],
                trim: true,
                maxlength: [10, "Book code must be less than 10 characters"]
            },
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
                maxlength: [
                    1000,
                    "Description must be less than 500 characters"
                ]
            },
            genre: {
                type: [String],
                required: [true, "Genre is required"],
                enum: [
                    "FICTION",
                    "NON-FICTION",
                    "MAGAZINE",
                    "NEWSPAPER",
                    "PERIODICAL",
                    "REFERENCE",
                    "EDUCATION/TEXTBOOKS",
                    "RELIGION/SPIRITUALITY",
                    "MYSTERY/THRILLER",
                    "FANTASY",
                    "ROMANCE",
                    "COMEDY",
                    "HORROR",
                    "ADVENTURE",
                    "BIOGRAPHY/AUTOBIOGRAPHY",
                    "HISTORY",
                    "SELF-HELP",
                    "COOKING/FOOD",
                    "TRAVEL",
                    "COMICS/GRAPHIC NOVELS",
                    "DRAMA",
                    "POETRY",
                    "CHILDREN'S"
                ]
            },
            industryIdentifiers: {
                isbn10: {
                    type: String,
                    trim: true,
                    minlength: [10, "ISBN-10 must be at least 10 characters"],
                    maxlength: [10, "ISBN-10 must be less than 10 characters"]
                },
                isbn13: {
                    type: String,
                    trim: true,
                    required: [true, "ISBN-13 is required"],
                    minlength: [13, "ISBN-13 must be at least 13 characters"],
                    maxlength: [13, "ISBN-13 must be less than 13 characters"]
                }
            },
            pageCount: {
                type: Number,
                required: [true, "Page count is required"],
                trim: true,
                validate: {
                    validator: value => value > 0,
                    message: "Page count must be a positive number" // Validator for positive numbers
                }
            },
            thumbnail: {
                public_id: {
                    type: String,
                    trim: true,
                    default: ""
                },
                secure_url: {
                    type: String,
                    trim: true,
                    default:
                        "https://res.cloudinary.com/de4zawd4d/image/upload/v1712392736/samples/cloudinary-icon.png"
                }
            }
        },
        borrowedBy: {
            _id: {
                type: String,
                required: [true, "User id is required"],
                trim: true
            },
            name: {
                type: String,
                required: [true, "Name is required"],
                maxlength: [50, "Name must be less than 50 characters"],
                trim: true
            },
            email: {
                type: String,
                required: [true, "Email is required"],
                trim: true,
                lowercase: true,
                match: [
                    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    "Invalid email format"
                ]
            },
            phone: {
                type: String,
                required: [true, "Phone number is required"],
                trim: true,
                match: [
                    /^(\+91[\-\s]?)?[0]?[6-9]\d{9}$/,
                    "Invalid phone number format"
                ]
            },
            avatar: {
                public_id: {
                    type: String,
                    default: "",
                    trim: true
                },
                secure_url: {
                    type: String,
                    default:
                        "https://res.cloudinary.com/de4zawd4d/image/upload/v1712392736/samples/cloudinary-icon.png",
                    trim: true
                }
            },
            address: {
                country: {
                    type: String,
                    trim: true,
                    required: [true, "Country is required"]
                },
                state: {
                    type: String,
                    trim: true,
                    required: [true, "State is required"]
                },
                city: {
                    type: String,
                    trim: true,
                    required: [true, "City is required"]
                },
                pincode: {
                    type: String,
                    trim: true,
                    required: [true, "Pincode is required"]
                },
                address_line_1: {
                    type: String,
                    trim: true,
                    required: [true, "Address line 1 is required"]
                },
                address_line_2: {
                    type: String,
                    trim: true,
                    default: null
                }
            },
            role: {
                type: String,
                required: true,
                enum: ["USER", "LIBRARIAN", "ADMIN"],
                default: "USER"
            }
        },
        issuedBy: {
            _id: {
                type: String,
                required: [true, "User id is required"],
                trim: true
            },
            name: {
                type: String,
                required: [true, "Name is required"],
                maxlength: [50, "Name must be less than 50 characters"],
                trim: true
            },
            email: {
                type: String,
                required: [true, "Email is required"],
                trim: true,
                lowercase: true,
                match: [
                    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    "Invalid email format"
                ]
            },
            phone: {
                type: String,
                required: [true, "Phone number is required"],
                trim: true,
                match: [
                    /^(\+91[\-\s]?)?[0]?[6-9]\d{9}$/,
                    "Invalid phone number format"
                ]
            },
            avatar: {
                public_id: {
                    type: String,
                    default: "",
                    trim: true
                },
                secure_url: {
                    type: String,
                    default:
                        "https://res.cloudinary.com/de4zawd4d/image/upload/v1712392736/samples/cloudinary-icon.png",
                    trim: true
                }
            },
            address: {
                country: {
                    type: String,
                    trim: true,
                    required: [true, "Country is required"]
                },
                state: {
                    type: String,
                    trim: true,
                    required: [true, "State is required"]
                },
                city: {
                    type: String,
                    trim: true,
                    required: [true, "City is required"]
                },
                pincode: {
                    type: String,
                    trim: true,
                    required: [true, "Pincode is required"]
                },
                address_line_1: {
                    type: String,
                    trim: true,
                    required: [true, "Address line 1 is required"]
                },
                address_line_2: {
                    type: String,
                    trim: true,
                    default: null
                }
            },
            role: {
                type: String,
                required: true,
                enum: ["LIBRARIAN", "ADMIN"]
            }
        },
        returnDate: {
            type: Date,
            required: [true, "Return date is required"],
            trim: true
        },
        status: {
            type: String,
            enum: ["PENDING", "FINED", "PAID", "RETURNED"],
            default: "PENDING",
        }
    },
    {
        timestamps: true
    }
);

export const BookTransaction = mongoose.model(
    "BookTransaction",
    bookTransactionSchema
);
