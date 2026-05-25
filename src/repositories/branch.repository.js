import { Branch } from "../models/index.js";

class BranchRepository {
    async create(branchData) {
        return await Branch.create(branchData);
    }

    async findByBranchId(branchId) {
        return await Branch.findOne({ branchId });
    }

    async findById(id) {
        return await Branch.findById(id);
    }

    async find(query = {}) {
        return await Branch.find(query);
    }

    async update(branchId, updateData) {
        return await Branch.findOneAndUpdate(
            { branchId },
            { $set: updateData },
            { new: true }
        );
    }

    async delete(branchId) {
        return await Branch.findOneAndDelete({ branchId });
    }
}

export default new BranchRepository();
