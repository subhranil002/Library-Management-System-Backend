import { BookTransaction } from "../models/index.js";

class TransactionRepository {
    async create(transactionData) {
        return await BookTransaction.create(transactionData);
    }

    async findById(id) {
        return await BookTransaction.findById(id);
    }

    async findOne(query = {}) {
        return await BookTransaction.findOne(query);
    }

    async find(query = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) {
        return await BookTransaction.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }

    async update(id, updateData) {
        return await BookTransaction.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );
    }

    async countDocuments(query = {}) {
        return await BookTransaction.countDocuments(query);
    }
}

export default new TransactionRepository();
