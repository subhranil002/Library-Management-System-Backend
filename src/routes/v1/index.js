import { Router } from "express";
import healthCheckRouter from "./healthCheck.routes.js";
import userRouter from "./user.routes.js";
import bookRouter from "./book.routes.js";
import paymentRouter from "./payment.routes.js";
import reservationRouter from "./reservation.routes.js";
import renewalRouter from "./renewal.routes.js";
import inventoryRouter from "./inventory.routes.js";
import barcodeRouter from "./barcode.routes.js";
import recommendationRouter from "./recommendation.routes.js";
import reviewRouter from "./review.routes.js";
import analyticsRouter from "./analytics.routes.js";
import assistantRouter from "./assistant.routes.js";

const v1Router = Router();

v1Router.use("/healthcheck", healthCheckRouter);
v1Router.use("/user", userRouter);
v1Router.use("/book", bookRouter);
v1Router.use("/payment", paymentRouter);
v1Router.use("/reservation", reservationRouter);
v1Router.use("/borrow", renewalRouter);
v1Router.use("/inventory", inventoryRouter);
v1Router.use("/barcode", barcodeRouter);
v1Router.use("/recommendations", recommendationRouter);
v1Router.use("/reviews", reviewRouter);
v1Router.use("/analytics", analyticsRouter);
v1Router.use("/assistant", assistantRouter);

export default v1Router;
