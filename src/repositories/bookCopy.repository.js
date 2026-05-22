import { BookCopy } from "../models/index.js";

class BookCopyRepository {
    async create(copyData) {
        return await BookCopy.create(copyData);
    }

    async findByCopyId(copyId) {
        return await BookCopy.findOne({ copyId });
    }

    async findById(id) {
        return await BookCopy.findById(id);
    }

    async find(query = {}) {
        return await BookCopy.find(query);
    }

    async update(copyId, updateData) {
        return await BookCopy.findOneAndUpdate(
            { copyId },
            { $set: updateData },
            { new: true }
        );
    }

    async delete(copyId) {
        return await BookCopy.findOneAndDelete({ copyId });
    }

    async countDocuments(query = {}) {
        return await BookCopy.countDocuments(query);
    }
}

export default new BookCopyRepository();
