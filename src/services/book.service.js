import bookRepository from "../repositories/book.repository.js";
import { ApiError } from "../utils/index.js";

class BookService {
    async getBookDetails(isbn13) {
        const book = await bookRepository.findByIsbn13(isbn13);
        if (!book) {
            throw new ApiError("Book not found in catalog", 404);
        }
        return book;
    }

    async registerBook(bookData) {
        const existing = await bookRepository.findByIsbn13(bookData.industryIdentifiers.isbn13);
        if (existing) {
            throw new ApiError("Book with this ISBN-13 already exists in the catalog", 400);
        }
        return await bookRepository.create(bookData);
    }
}

export default new BookService();
