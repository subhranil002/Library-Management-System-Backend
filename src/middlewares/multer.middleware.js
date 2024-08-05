import multer from "multer";
import path from "path";
import { ApiError } from "../utils/index.js";

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/temp");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// File type validation function
const fileFilter = (_req, file, cb) => {
    let ext = path.extname(file.originalname);

    if (
        ext !== ".jpg" &&
        ext !== ".jpeg" &&
        ext !== ".webp" &&
        ext !== ".png"
    ) {
        cb(new ApiError("Invalid file type", 400), false);
        return;
    }

    cb(null, true);
};

const upload = multer({ storage, fileFilter });
export default upload;
