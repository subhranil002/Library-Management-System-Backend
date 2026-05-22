import { Book } from "../models/index.js";

class BookRepository {
    async create(bookData) {
        return await Book.create(bookData);
    }

    async findByIsbn13(isbn13) {
        return await Book.findOne({ "industryIdentifiers.isbn13": isbn13 });
    }

    async findByBookCode(bookCode) {
        return await Book.findOne({ bookCode });
    }

    async findById(id) {
        return await Book.findById(id);
    }

    async find(query = {}, skip = 0, limit = 10, sort = {}) {
        return await Book.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }

    async updateByIsbn13(isbn13, updateData) {
        return await Book.findOneAndUpdate(
            { "industryIdentifiers.isbn13": isbn13 },
            { $set: updateData },
            { new: true }
        );
    }

    async deleteByIsbn13(isbn13) {
        return await Book.findOneAndDelete({ "industryIdentifiers.isbn13": isbn13 });
    }

    async countDocuments(query = {}) {
        return await Book.countDocuments(query);
    }
}

export default new BookRepository();
