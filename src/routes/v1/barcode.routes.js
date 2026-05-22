import { Router } from "express";
import { isLoggedIn, isAdmin } from "../../middlewares/auth.middleware.js";
import { 
    generateCopyQR, 
    generateUserCardQR, 
    getCopyQR, 
    verifyScan 
} from "../../controllers/barcode.controller.js";

const barcodeRouter = Router();

// Secure routes
barcodeRouter.use(isLoggedIn);

// Generate QR codes (Admin/Librarian level operations usually, but users can generate their own card perhaps. Admin only for now for safety)
barcodeRouter.route("/copies/:copyId/qr").post(isAdmin, generateCopyQR);
barcodeRouter.route("/users/:userId/card-qr").post(isAdmin, generateUserCardQR);

// Fetch copy QR data
barcodeRouter.route("/copies/:copyId/code").get(getCopyQR);

// Verify scans (e.g. at the circulation desk)
barcodeRouter.route("/scan/verify").post(isAdmin, verifyScan);

export default barcodeRouter;
