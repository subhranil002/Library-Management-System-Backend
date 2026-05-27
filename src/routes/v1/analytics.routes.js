import { Router } from "express";
import { isLoggedIn, isAdmin } from "../../middlewares/auth.middleware.js";
import { 
    getOverview, 
    getTopIssuedBooks, 
    getTrendingAuthors,
    getTrendingGenres
} from "../../controllers/analytics.controller.js";

const analyticsRouter = Router();

// Analytics are strictly for internal library staff
analyticsRouter.use(isLoggedIn);
analyticsRouter.use(isAdmin);

analyticsRouter.route("/overview").get(getOverview);
analyticsRouter.route("/books/top-issued").get(getTopIssuedBooks);
analyticsRouter.route("/authors/trending").get(getTrendingAuthors);
analyticsRouter.route("/genres/trending").get(getTrendingGenres);

export default analyticsRouter;
