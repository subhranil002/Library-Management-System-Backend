const errorMiddleware = (err, req, res, next) => {
    // Get error details
    const { statusCode, message, stack } = err;

    console.log("ErrorMiddleware: ", err);

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        stack
    });
};

export default errorMiddleware;
