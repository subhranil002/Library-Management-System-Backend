import { ApiError } from "../utils/index.js";

export const validateUserProfileUpdate = (req, res, next) => {
    const { fullName, email } = req.body;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError("Invalid email address format", 400);
    }

    if (fullName && fullName.trim().length < 3) {
        throw new ApiError("Full name must be at least 3 characters long", 400);
    }

    next();
};
