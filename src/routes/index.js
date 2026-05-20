import { Router } from "express";
import v1Router from "./v1/index.js";
import v2Router from "./v2/index.js";

const rootRouter = Router();

// Mount API Versions
rootRouter.use("/v1", v1Router);
rootRouter.use("/v2", v2Router);

export default rootRouter;
