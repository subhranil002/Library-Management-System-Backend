import express from "express";
import { errorMiddleware } from "./middlewares/index.js";
import morgan from "morgan";
import cors from "cors";
import constants from "./constants.js";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/index.js";

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

// API Routes
app.use("/api", apiRouter);

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
