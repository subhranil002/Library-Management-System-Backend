import { Router } from "express";
import { isLoggedIn, isVerified } from "../../middlewares/auth.middleware.js";
import { renewBook, getRenewalStatus } from "../../controllers/renewal.controller.js";

const renewalRouter = Router();

// Secure all renewal routes
renewalRouter.use(isLoggedIn);
renewalRouter.use(isVerified);

renewalRouter.route("/:borrowId/renew").post(renewBook);
renewalRouter.route("/:borrowId/renewal-status").get(getRenewalStatus);

export default renewalRouter;
