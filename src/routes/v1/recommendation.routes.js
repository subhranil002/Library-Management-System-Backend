import { Router } from "express";
import { isLoggedIn } from "../../middlewares/auth.middleware.js";
import { 
    getMyRecommendations, 
    getPopularRecommendations, 
    logEvent, 
    getRecommendationsByGenre 
} from "../../controllers/recommendation.controller.js";

const recommendationRouter = Router();

// Public / general recommendations
recommendationRouter.route("/popular").get(getPopularRecommendations);
recommendationRouter.route("/by-genre/:genre").get(getRecommendationsByGenre);

// Protected routes
recommendationRouter.use(isLoggedIn);
recommendationRouter.route("/me").get(getMyRecommendations);
recommendationRouter.route("/event").post(logEvent);

export default recommendationRouter;
