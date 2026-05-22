import { BookCopy, User } from "../models/index.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { generateAndUploadQR } from "../utils/barcodeGenerator.js";

// Generate QR for a Book Copy
export const generateCopyQR = asyncHandler(async (req, res, next) => {
    try {
        const { copyId } = req.params;

        const copy = await BookCopy.findOne({ copyId });
        if (!copy) {
            throw new ApiError("Book copy not found", 404);
        }

        const payload = {
            type: "BOOK_COPY",
            copyId: copy.copyId,
            isbn13: copy.isbn13,
            branchId: copy.branch.toString()
        };

        const qrUrl = await generateAndUploadQR(payload, `copy_${copyId}`);

        copy.qrCodeValue = JSON.stringify(payload);
        copy.qrCodeUrl = qrUrl;
        await copy.save();

        res.status(200).json(new ApiResponse("QR Code generated for copy successfully", { qrCodeUrl: qrUrl }));
    } catch (error) {
        next(new ApiError(`barcode.controller :: generateCopyQR :: ${error.message}`, error.statusCode || 500));
    }
});

// Generate QR for a User's Library Card
export const generateUserCardQR = asyncHandler(async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError("User not found", 404);
        }

        const payload = {
            type: "USER_CARD",
            userId: user._id.toString(),
            role: user.role
        };

        const qrUrl = await generateAndUploadQR(payload, `user_${userId}`);

        user.libraryCardQrCodeUrl = qrUrl;
        await user.save();

        res.status(200).json(new ApiResponse("User library card QR Code generated successfully", { qrCodeUrl: qrUrl }));
    } catch (error) {
        next(new ApiError(`barcode.controller :: generateUserCardQR :: ${error.message}`, error.statusCode || 500));
    }
});

// Fetch copy QR data
export const getCopyQR = asyncHandler(async (req, res, next) => {
    try {
        const { copyId } = req.params;

        const copy = await BookCopy.findOne({ copyId }).select("copyId isbn13 qrCodeUrl status branch");
        if (!copy) {
            throw new ApiError("Book copy not found", 404);
        }

        res.status(200).json(new ApiResponse("QR Code fetched successfully", copy));
    } catch (error) {
        next(new ApiError(`barcode.controller :: getCopyQR :: ${error.message}`, error.statusCode || 500));
    }
});

// Verify scanned QR Code
export const verifyScan = asyncHandler(async (req, res, next) => {
    try {
        const { scannedData } = req.body;

        if (!scannedData) {
            throw new ApiError("No scanned data provided", 400);
        }

        let payload;
        try {
            payload = typeof scannedData === 'string' ? JSON.parse(scannedData) : scannedData;
        } catch (e) {
            throw new ApiError("Invalid QR Code payload format. Must be JSON.", 400);
        }

        if (payload.type === "BOOK_COPY") {
            const copy = await BookCopy.findOne({ copyId: payload.copyId }).populate("branch", "name");
            if (!copy) {
                throw new ApiError("Scanned copy not found in system", 404);
            }
            return res.status(200).json(new ApiResponse("Book copy scanned successfully", { type: "BOOK_COPY", data: copy }));
        } 
        
        if (payload.type === "USER_CARD") {
            const user = await User.findById(payload.userId).select("-password -refreshToken");
            if (!user) {
                throw new ApiError("Scanned user not found in system", 404);
            }
            return res.status(200).json(new ApiResponse("User card scanned successfully", { type: "USER_CARD", data: user }));
        }

        throw new ApiError("Unrecognized QR Code type", 400);
    } catch (error) {
        next(new ApiError(`barcode.controller :: verifyScan :: ${error.message}`, error.statusCode || 500));
    }
});
