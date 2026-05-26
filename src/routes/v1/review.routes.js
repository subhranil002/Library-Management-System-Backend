import { Router } from "express";
import { isLoggedIn, isAdmin } from "../../middlewares/auth.middleware.js";
import { 
    addReview, 
    getReviews, 
    updateReview, 
    deleteReview, 
    flagReview 
} from "../../controllers/review.controller.js";

const reviewRouter = Router();

// Publicly readable endpoints (if desired, or make them logged-in only. Standard is public)
reviewRouter.route("/books/:isbn13/reviews").get(getReviews);

// Protected endpoints for users
reviewRouter.use(isLoggedIn);
reviewRouter.route("/books/:isbn13/reviews").post(addReview);
reviewRouter.route("/:id").patch(updateReview);
reviewRouter.route("/:id").delete(deleteReview);

// Admin / Moderation endpoints
reviewRouter.route("/:id/flag").post(isAdmin, flagReview);

export default reviewRouter;
