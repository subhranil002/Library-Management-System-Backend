import { Router } from "express";
import { isLoggedIn, isAdmin } from "../../middlewares/auth.middleware.js";
import { 
    addCopy, 
    issueCopy, 
    returnCopy, 
    transferCopy, 
    getAvailability, 
    createBranch 
} from "../../controllers/inventory.controller.js";

const inventoryRouter = Router();

// Branch endpoints
inventoryRouter.route("/branches").post(isLoggedIn, isAdmin, createBranch);

// Book / ISBN level inventory
inventoryRouter.route("/books/:isbn13/copies").post(isLoggedIn, isAdmin, addCopy);
inventoryRouter.route("/books/:isbn13/availability").get(getAvailability);

// Copy level operations
inventoryRouter.route("/copies/:copyId/issue").post(isLoggedIn, isAdmin, issueCopy);
inventoryRouter.route("/copies/:copyId/return").post(isLoggedIn, isAdmin, returnCopy);
inventoryRouter.route("/copies/:copyId/transfer").post(isLoggedIn, isAdmin, transferCopy);

export default inventoryRouter;
