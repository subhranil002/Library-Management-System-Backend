import { ApiResponse, asyncHandler, ApiError } from "../utils/index.js";
import inventoryService from "../services/inventory.service.js";

// Add a physical copy
export const addCopy = asyncHandler(async (req, res, next) => {
    try {
        const { isbn13 } = req.params;
        const { copyId, branchId, rackLocation, condition, barcodeValue } = req.body;

        const newCopy = await inventoryService.addCopy(isbn13, {
            copyId,
            branchId,
            rackLocation,
            condition,
            barcodeValue
        });

        res.status(201).json(new ApiResponse("Book copy added successfully", newCopy));
    } catch (error) {
        if (error.code === 11000) {
            next(new ApiError("copyId or barcode must be unique", 400));
        } else {
            next(error);
        }
    }
});

// Issue a copy directly
export const issueCopy = asyncHandler(async (req, res, next) => {
    try {
        const { copyId } = req.params;
        const copy = await inventoryService.issueCopy(copyId);

        res.status(200).json(new ApiResponse("Copy issued successfully", copy));
    } catch (error) {
        next(error);
    }
});

// Return a copy directly
export const returnCopy = asyncHandler(async (req, res, next) => {
    try {
        const { copyId } = req.params;
        const copy = await inventoryService.returnCopy(copyId);

        res.status(200).json(new ApiResponse("Copy returned to available status", copy));
    } catch (error) {
        next(error);
    }
});

// Transfer copy
export const transferCopy = asyncHandler(async (req, res, next) => {
    try {
        const { copyId } = req.params;
        const { toBranchId } = req.body;

        const copy = await inventoryService.transferCopy(copyId, toBranchId);

        res.status(200).json(new ApiResponse("Copy transferred successfully", copy));
    } catch (error) {
        next(error);
    }
});

// Get availability by ISBN
export const getAvailability = asyncHandler(async (req, res, next) => {
    try {
        const { isbn13 } = req.params;
        const availability = await inventoryService.getAvailability(isbn13);

        res.status(200).json(new ApiResponse("Availability fetched", availability));
    } catch (error) {
        next(error);
    }
});

// Create Branch
export const createBranch = asyncHandler(async (req, res, next) => {
    try {
        const { name, address, contact } = req.body;
        const branch = await inventoryService.createBranch(name, address, contact);

        res.status(201).json(new ApiResponse("Branch created successfully", branch));
    } catch (error) {
        next(error);
    }
});
