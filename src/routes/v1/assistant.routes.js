import { Router } from "express";
import { isLoggedIn } from "../../middlewares/auth.middleware.js";
import { 
    chat, 
    getSession, 
    getUserSessions 
} from "../../controllers/assistant.controller.js";

const assistantRouter = Router();

// All assistant routes require login to track session and personalize answers
assistantRouter.use(isLoggedIn);

assistantRouter.route("/chat").post(chat);
assistantRouter.route("/sessions").get(getUserSessions);
assistantRouter.route("/session/:sessionId").get(getSession);

export default assistantRouter;
