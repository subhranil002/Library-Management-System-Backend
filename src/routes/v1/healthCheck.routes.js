import { Router } from "express";
import { healthCheck } from "../../controllers/healthCheck.controller.js";
const healthCheckRouter = Router();

// Health check route
healthCheckRouter.route("/").get(healthCheck);

export default healthCheckRouter;