import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const isLoggedIn = async (req, res, next) => {
    try {
        // Get access token from request
        const accessToken = req.cookies?.accessToken;
        if (!accessToken) {
            throw new ApiError("Access token not found", 401);
        }

        // Check if access token is valid
        const decodedAccessToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        if (!decodedAccessToken?._id) {
            throw new ApiError("Access token is invalid", 401);
        }

        // Check if user is verified
        const user = await User.findById(decodedAccessToken._id);
        if (!user) {
            throw new ApiError("User not found", 401);
        }

        // Set user in request
        req.user = user;

        next();
    } catch (error) {
        return next(
            new ApiError(
                `auth.middleware :: isLoggedIn: ${error}`,
                error.statusCode
            )
        );
    }
};

export const authorizedRoles =
    (...roles) =>
    async (req, res, next) => {
        try {
            // Get current user role
            const currentRole = req.user?.role;

            // Check if user has required role
            if (!roles.includes(currentRole)) {
                throw new ApiError("Unauthorized role", 401);
            }

            next();
        } catch (error) {
            return next(
                new ApiError(
                    `auth.middleware :: authorizedRoles: ${error}`,
                    error.statusCode
                )
            );
        }
    };
