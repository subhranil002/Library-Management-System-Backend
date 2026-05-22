import bookRepository from "../repositories/book.repository.js";
import bookCopyRepository from "../repositories/bookCopy.repository.js";
import branchRepository from "../repositories/branch.repository.js";
import { BookCopy } from "../models/index.js";
import { ApiError } from "../utils/index.js";

/**
 * Recalculates and updates the stock summary for a specific branch.
 */
export const updateBranchStockSummary = async (branchId) => {
    try {
        const stats = await BookCopy.aggregate([
            { $match: { branch: branchId } },
            {
                $group: {
                    _id: null,
                    totalCopies: { $sum: 1 },
                    availableCopies: {
                        $sum: { $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0] }
                    },
                    issuedCopies: {
                        $sum: { $cond: [{ $eq: ["$status", "ISSUED"] }, 1, 0] }
                    },
                    damagedCopies: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", ["LOST", "DAMAGED"]] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        let summary = {
            totalCopies: 0,
            availableCopies: 0,
            issuedCopies: 0,
            damagedCopies: 0
        };

        if (stats.length > 0) {
            summary = {
                totalCopies: stats[0].totalCopies,
                availableCopies: stats[0].availableCopies,
                issuedCopies: stats[0].issuedCopies,
                damagedCopies: stats[0].damagedCopies
            };
        }

        await branchRepository.update(branchId, { stockSummary: summary });
    } catch (error) {
        console.error("Error updating branch stock summary:", error);
    }
};

class InventoryService {
    async addCopy(isbn13, { copyId, branchId, rackLocation, condition, barcodeValue }) {
        if (!copyId || !branchId) {
            throw new ApiError("copyId and branchId are required", 400);
        }

        const book = await bookRepository.findByIsbn13(isbn13);
        if (!book) {
            throw new ApiError("Book with given ISBN not found", 404);
        }

        const branch = await branchRepository.findById(branchId);
        if (!branch) {
            throw new ApiError("Branch not found", 404);
        }

        const newCopy = await bookCopyRepository.create({
            copyId,
            isbn13,
            branch: branchId,
            rackLocation,
            condition,
            barcodeValue
        });

        await updateBranchStockSummary(branchId);
        return newCopy;
    }

    async issueCopy(copyId) {
        const copy = await bookCopyRepository.findByCopyId(copyId);
        if (!copy) {
            throw new ApiError("Copy not found", 404);
        }

        if (copy.status !== "AVAILABLE") {
            throw new ApiError(`Copy is currently ${copy.status.toLowerCase()} and cannot be issued`, 400);
        }

        copy.status = "ISSUED";
        await copy.save();

        await updateBranchStockSummary(copy.branch);
        return copy;
    }

    async returnCopy(copyId) {
        const copy = await bookCopyRepository.findByCopyId(copyId);
        if (!copy) {
            throw new ApiError("Copy not found", 404);
        }

        if (copy.status !== "ISSUED") {
            throw new ApiError("This copy is not currently issued", 400);
        }

        copy.status = "AVAILABLE";
        await copy.save();

        await updateBranchStockSummary(copy.branch);
        return copy;
    }

    async transferCopy(copyId, toBranchId) {
        if (!toBranchId) {
            throw new ApiError("Destination branch ID is required", 400);
        }

        const copy = await bookCopyRepository.findByCopyId(copyId);
        if (!copy) {
            throw new ApiError("Copy not found", 404);
        }

        if (copy.status !== "AVAILABLE") {
            throw new ApiError(`Cannot transfer copy in ${copy.status} status`, 400);
        }

        const oldBranchId = copy.branch;
        copy.branch = toBranchId;
        await copy.save();

        await updateBranchStockSummary(oldBranchId);
        await updateBranchStockSummary(toBranchId);

        return copy;
    }

    async getAvailability(isbn13) {
        // Find copies and populate branch info
        const copies = await bookCopyRepository.find({ isbn13 });
        
        // Populate branch using Mongoose since BookCopy is a Mongoose document
        const populatedCopies = await BookCopy.populate(copies, {
            path: "branch",
            select: "name address contact stockSummary"
        });

        // Group by branch
        const availability = populatedCopies.reduce((acc, copy) => {
            if (!copy.branch) return acc;
            const bId = copy.branch._id.toString();
            if (!acc[bId]) {
                acc[bId] = {
                    branchName: copy.branch.name,
                    address: copy.branch.address,
                    totalCopies: 0,
                    availableCopies: 0,
                    copies: []
                };
            }
            
            acc[bId].totalCopies++;
            if (copy.status === "AVAILABLE") acc[bId].availableCopies++;
            acc[bId].copies.push({
                copyId: copy.copyId,
                status: copy.status,
                rackLocation: copy.rackLocation
            });

            return acc;
        }, {});

        return Object.values(availability);
    }

    async createBranch(name, address, contact) {
        if (!name || !address) {
            throw new ApiError("Name and address are required", 400);
        }
        return await branchRepository.create({ name, address, contact });
    }
}

export default new InventoryService();
