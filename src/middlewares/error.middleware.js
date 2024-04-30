import constants from "../constants.js";

const errorMiddleware = (err, req, res, next) => {
    // Get error details
    const { statusCode, message, stack } = err;

    if (constants.NODE_ENV === "development") {
        console.log("ErrorMiddleware: ", err);

        // Send error response
        return res.status(statusCode).json({
            success: false,
            message,
            stack
        });
    }

    // Send error response
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

export default errorMiddleware;
