import express from "express";
import { errorMiddleware } from "./middlewares/index.js";
import morgan from "morgan";
import cors from "cors";
import constants from "./constants.js";
import cookieParser from "cookie-parser";
import {
    healthCheckRouter as v1HealthCheckRouter,
    userRouter as v1UserRouter,
    bookRouter as v1BookRouter,
    paymentRouter as v1PaymentRouter
} from "./routes/v1/index.js";

const app = express();

// Middleware
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true
    })
);
app.use(
    cors({
        origin: constants.CORS_ORIGIN,
        credentials: true
    })
);
app.use(cookieParser());
app.use(express.static("public"));
app.use(morgan("dev"));

// V1 Routes
app.use("/api/v1/healthcheck", v1HealthCheckRouter);
app.use("/api/v1/user", v1UserRouter);
app.use("/api/v1/book", v1BookRouter);
app.use("/api/v1/payment", v1PaymentRouter);

// Handle 404 errors
app.all("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Page not found"
    });
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
