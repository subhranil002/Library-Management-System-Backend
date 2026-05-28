export const mockUsers = {
    admin: {
        name: "Test Admin",
        email: "admin.test@booksphere.com",
        phone: "+919999999999",
        password: "AdminPassword123",
        role: "ADMIN",
        verified: true,
        address: {
            country: "India",
            state: "West Bengal",
            city: "Kolkata",
            pincode: "700001",
            address_line_1: "Admin Street 1"
        }
    },
    librarian: {
        name: "Test Librarian",
        email: "librarian.test@booksphere.com",
        phone: "+918888888888",
        password: "LibrarianPassword123",
        role: "LIBRARIAN",
        verified: true,
        address: {
            country: "India",
            state: "West Bengal",
            city: "Kolkata",
            pincode: "700002",
            address_line_1: "Librarian Street 2"
        }
    },
    member: {
        name: "Test Member",
        email: "member.test@booksphere.com",
        phone: "+917777777777",
        password: "MemberPassword123",
        role: "USER",
        verified: true,
        address: {
            country: "India",
            state: "West Bengal",
            city: "Kolkata",
            pincode: "700003",
            address_line_1: "Member Street 3"
        }
    },
    unverified: {
        name: "Unverified Member",
        email: "unverified.test@booksphere.com",
        phone: "+916666666666",
        password: "UserPassword123",
        role: "USER",
        verified: false,
        address: {
            country: "India",
            state: "West Bengal",
            city: "Kolkata",
            pincode: "700004",
            address_line_1: "Unverified Street 4"
        }
    }
};

export const mockBranches = [
    {
        name: "Central Library Branch",
        address: "100 Main Street, Metro City",
        contact: "+919876543210",
        branchId: "BRANCH-001"
    },
    {
        name: "Northside Library Branch",
        address: "200 North Ave, Metro City",
        contact: "+918765432109",
        branchId: "BRANCH-002"
    }
];

export const mockBooks = [
    {
        bookCode: "BOOK-AI-001",
        title: "Introduction to Artificial Intelligence",
        author: "Dr. John Doe",
        isbn10: "0136042597",
        isbn13: "9780136042594",
        genre: ["Technology", "AI"],
        publisher: "Prentice Hall",
        publishedDate: "2020-01-01",
        description: "A comprehensive guide to fundamental AI principles.",
        pageCount: 400
    },
    {
        bookCode: "BOOK-WD-002",
        title: "Fullstack Web Development Guide",
        author: "Jane Smith",
        isbn10: "1484250553",
        isbn13: "9781484250556",
        genre: ["Technology", "Programming"],
        publisher: "Apress",
        publishedDate: "2021-05-15",
        description: "Learn modern web stack development from scratch.",
        pageCount: 350
    }
];

export const mockCopies = [
    {
        copyId: "COPY-AI-001-A",
        isbn13: "9780136042594",
        rackLocation: "Rack A1",
        condition: "NEW",
        barcodeValue: "BARCODE-AI-001-A"
    },
    {
        copyId: "COPY-AI-001-B",
        isbn13: "9780136042594",
        rackLocation: "Rack A2",
        condition: "GOOD",
        barcodeValue: "BARCODE-AI-001-B"
    }
];
