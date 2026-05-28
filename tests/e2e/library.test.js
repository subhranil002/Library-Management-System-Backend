import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import path from "node:path";
import app from "../../src/app.js";
import { setupTestDatabase, closeTestDatabase } from "../helpers/db.helper.js";
import { mockUsers } from "../helpers/seed.helper.js";
import { getAuthCookies } from "../helpers/auth.helper.js";
import { 
    User, 
    Otp, 
    Book, 
    BookCopy, 
    Reservation, 
    BookTransaction, 
    Notification, 
    AuditLog, 
    Review, 
    Branch,
    LibraryPolicy
} from "../../src/models/index.js";

// Setup database before running any tests
before(async () => {
    await setupTestDatabase();
});

// Clean up connection after tests finish
after(async () => {
    await closeTestDatabase();
});

test("BookSphere E2E Test Suite", async (t) => {
    let adminCookies = [];
    let userCookies = [];
    let newMemberId = null;
    let createdBookId = null;
    let seededBranchId = null;
    let borrowTransactionId = null;
    let activeReservationId = null;

    // Resolve pre-seeded Central Library Branch ID
    const centralBranch = await Branch.findOne({ name: "Central Library Branch" });
    assert.ok(centralBranch, "Central Library Branch should have been seeded");
    seededBranchId = centralBranch._id.toString();

    // Setup a library policy so AI chatbot can query it
    await LibraryPolicy.create({
        topic: "renewal",
        keywords: ["renew", "extension", "days"],
        content: "Books can be renewed up to 2 times for 14 days each, provided there are no reservations."
    });

    await t.test("1. Authentication Flow", async (t) => {
        await t.test("Admin Login", async () => {
            const loginRes = await request(app)
                .post("/api/v1/user/login")
                .send({
                    email: mockUsers.admin.email,
                    password: mockUsers.admin.password
                });

            assert.strictEqual(loginRes.status, 200);
            assert.strictEqual(loginRes.body.success, true);
            assert.ok(loginRes.headers["set-cookie"], "Should return cookies");
            adminCookies = loginRes.headers["set-cookie"];
        });

        await t.test("Register a New Member (by Admin)", async () => {
            const registerRes = await request(app)
                .post("/api/v1/user/register")
                .set("Cookie", adminCookies)
                .send({
                    name: "E2E Member",
                    email: "e2emember@test.com",
                    phone: "+919876543210",
                    password: "MemberPassword123",
                    country: "India",
                    state: "West Bengal",
                    city: "Kolkata",
                    pincode: "700091",
                    address_line_1: "Salt Lake Sector V",
                    role: "USER"
                });

            assert.strictEqual(registerRes.status, 200); // register returns 200 on success
            const userInDb = await User.findOne({ email: "e2emember@test.com" });
            assert.ok(userInDb);
            newMemberId = userInDb._id.toString();
        });

        await t.test("Send and Verify OTP for Registration", async () => {
            // Trigger send-otp
            const otpSendRes = await request(app)
                .post("/api/v1/user/send-otp")
                .set("Cookie", adminCookies)
                .send({ email: "e2emember@test.com" });

            assert.strictEqual(otpSendRes.status, 200);

            // Fetch OTP directly from MongoDB (bypass real mail server check)
            const otpDoc = await Otp.findOne({ email: "e2emember@test.com" });
            assert.ok(otpDoc, "OTP document should exist in DB");
            assert.strictEqual(otpDoc.otp.length, 6);

            // Verify OTP
            const otpVerifyRes = await request(app)
                .post("/api/v1/user/verify-otp")
                .set("Cookie", adminCookies)
                .send({
                    email: "e2emember@test.com",
                    otp: otpDoc.otp
                });

            assert.strictEqual(otpVerifyRes.status, 200);

            // Check verified status in DB
            const userInDb = await User.findById(newMemberId);
            assert.strictEqual(userInDb.verified, true);
        });

        await t.test("New Member Login", async () => {
            const loginRes = await request(app)
                .post("/api/v1/user/login")
                .send({
                    email: "e2emember@test.com",
                    password: "MemberPassword123"
                });

            assert.strictEqual(loginRes.status, 200);
            assert.ok(loginRes.headers["set-cookie"]);
            userCookies = loginRes.headers["set-cookie"];
        });

        await t.test("Unauthorized Block Check", async () => {
            const unauthorizedRes = await request(app)
                .get("/api/v1/user/current-user");

            assert.strictEqual(unauthorizedRes.status, 401);
        });
    });

    await t.test("2. Catalog (Books) Flow", async (t) => {
        await t.test("Librarian Creates a Book", async () => {
            const bookRes = await request(app)
                .post("/api/v1/book/add-book")
                .set("Cookie", adminCookies)
                .send({
                    bookCode: "BOOK-E2E-1",
                    title: "E2E Testing Guide",
                    subtitle: "", // include subtitle to avoid length of undefined error
                    author: "E2E Author",
                    isbn10: "1234567890",
                    isbn13: "9781234567890",
                    genre: ["EDUCATION/TEXTBOOKS"],
                    publisher: "E2E Publisher",
                    publishedDate: "2023-01-01",
                    description: "A book for E2E testing standard flows.",
                    pageCount: 300,
                    language: "en"
                });

            assert.strictEqual(bookRes.status, 200); // addBook returns 200 on success
            assert.strictEqual(bookRes.body.data.bookCode, "BOOK-E2E-1");
            createdBookId = bookRes.body.data._id;
        });

        await t.test("Fetch Book by ISBN", async () => {
            const getRes = await request(app)
                .get("/api/v1/book/get-book/9781234567890");

            assert.strictEqual(getRes.status, 200);
            // getBookDetails returns an array from aggregation pipeline
            assert.strictEqual(getRes.body.data[0].volumeInfo.title, "E2E Testing Guide");
        });

        await t.test("Search for Book", async () => {
            const searchRes = await request(app)
                .get("/api/v1/book/search-books?query=Testing");

            assert.strictEqual(searchRes.status, 200);
            assert.ok(searchRes.body.data.length > 0);
        });

        await t.test("Update Book Thumbnail (Multipart Upload)", async () => {
            const imagePath = path.resolve("tests", "helpers", "dummy.jpg");
            const updateRes = await request(app)
                .put("/api/v1/book/change-thumbnail/BOOK-E2E-1")
                .set("Cookie", adminCookies)
                .attach("thumbnail", imagePath);

            assert.strictEqual(updateRes.status, 200);
            assert.strictEqual(updateRes.body.data.public_id, "test_public_id");
        });

        await t.test("Unauthorized Action Protection", async () => {
            // Member trying to delete a book should fail (ADMIN only)
            const deleteRes = await request(app)
                .delete("/api/v1/book/delete-book/BOOK-E2E-1")
                .set("Cookie", userCookies);

            assert.strictEqual(deleteRes.status, 401); // authorizedRoles role check mismatch triggers 401
        });
    });

    await t.test("3. Copy & Branch Flow", async (t) => {
        await t.test("Add Physical Book Copy to Central Branch", async () => {
            const copyRes = await request(app)
                .post("/api/v1/inventory/books/9781234567890/copies")
                .set("Cookie", adminCookies)
                .send({
                    copyId: "COPY-E2E-1",
                    branchId: seededBranchId,
                    rackLocation: "Rack A-3",
                    condition: "NEW",
                    barcodeValue: "BARCODE-E2E-1"
                });

            assert.strictEqual(copyRes.status, 201);
            assert.strictEqual(copyRes.body.data.copyId, "COPY-E2E-1");
        });

        await t.test("Fetch Copy Availability", async () => {
            const availabilityRes = await request(app)
                .get("/api/v1/inventory/books/9781234567890/availability");

            assert.strictEqual(availabilityRes.status, 200);
            assert.ok(availabilityRes.body.data.length > 0);
            assert.strictEqual(availabilityRes.body.data[0].availableCopies, 1);
        });

        await t.test("Issue Book Copy", async () => {
            const issueRes = await request(app)
                .post("/api/v1/inventory/copies/COPY-E2E-1/issue")
                .set("Cookie", adminCookies);

            assert.strictEqual(issueRes.status, 200);
            assert.strictEqual(issueRes.body.data.status, "ISSUED");
        });

        await t.test("Prevent Issuing Unavailable Copy", async () => {
            const issueRes = await request(app)
                .post("/api/v1/inventory/copies/COPY-E2E-1/issue")
                .set("Cookie", adminCookies);

            assert.strictEqual(issueRes.status, 400);
        });

        await t.test("Return Copy", async () => {
            const returnRes = await request(app)
                .post("/api/v1/inventory/copies/COPY-E2E-1/return")
                .set("Cookie", adminCookies);

            assert.strictEqual(returnRes.status, 200);
            assert.strictEqual(returnRes.body.data.status, "AVAILABLE");
        });

        await t.test("Transfer Copy to Northside Branch", async () => {
            const northBranch = await Branch.findOne({ name: "Northside Library Branch" });
            const transferRes = await request(app)
                .post("/api/v1/inventory/copies/COPY-E2E-1/transfer")
                .set("Cookie", adminCookies)
                .send({ toBranchId: northBranch._id.toString() });

            assert.strictEqual(transferRes.status, 200);
            assert.strictEqual(transferRes.body.data.branch.toString(), northBranch._id.toString());
        });
    });

    await t.test("4. Reservations Flow", async (t) => {
        await t.test("Place a Reservation for Book", async () => {
            const resRes = await request(app)
                .post("/api/v1/reservation")
                .set("Cookie", userCookies)
                .send({ isbn13: "9781234567890" });

            assert.strictEqual(resRes.status, 201); // placeReservation returns 201 on success
            assert.strictEqual(resRes.body.data.status, "AVAILABLE");
            
            // Query DB directly to get the reservation ID
            const resInDb = await Reservation.findOne({ user: newMemberId, isbn13: "9781234567890", status: "AVAILABLE" });
            assert.ok(resInDb);
            activeReservationId = resInDb._id.toString();
        });

        await t.test("Retrieve My Active Reservations", async () => {
            const meRes = await request(app)
                .get("/api/v1/reservation/me")
                .set("Cookie", userCookies);

            assert.strictEqual(meRes.status, 200);
            assert.ok(meRes.body.data.length > 0);
        });

        await t.test("Prevent Duplicate Active Reservation", async () => {
            const duplicateRes = await request(app)
                .post("/api/v1/reservation")
                .set("Cookie", userCookies)
                .send({ isbn13: "9781234567890" });

            assert.strictEqual(duplicateRes.status, 400);
        });

        await t.test("Place Another Reservation for Waitlist Position", async () => {
            // Admin logs in/gets cookies for preseeded member
            const memberCookies = await getAuthCookies(mockUsers.member.email, mockUsers.member.password);

            const secondRes = await request(app)
                .post("/api/v1/reservation")
                .set("Cookie", memberCookies)
                .send({ isbn13: "9781234567890" });

            assert.strictEqual(secondRes.status, 201); // placeReservation returns 201 on success
            assert.strictEqual(secondRes.body.data.status, "WAITING");
            assert.strictEqual(secondRes.body.data.queuePosition, 1);
        });

        await t.test("Cancel First Reservation and Progress Waitlist Queue", async () => {
            const cancelRes = await request(app)
                .post(`/api/v1/reservation/${activeReservationId}/cancel`)
                .set("Cookie", userCookies);

            assert.strictEqual(cancelRes.status, 200);

            // Fetch the second reservation in the DB to see if it advanced to AVAILABLE status
            const secondUser = await User.findOne({ email: mockUsers.member.email });
            const secondInDb = await Reservation.findOne({ user: secondUser._id, isbn13: "9781234567890" });
            assert.ok(secondInDb);
            assert.strictEqual(secondInDb.status, "AVAILABLE");
            assert.strictEqual(secondInDb.queuePosition, null);
        });
    });

    await t.test("5. Renewals Flow", async (t) => {
        // Clear all active reservations to allow clean renewals check without waitlist interference
        await Reservation.deleteMany({});

        await t.test("Issue Book to Member", async () => {
            // Setup active issue transaction for member
            const issueRes = await request(app)
                .post("/api/v1/book/issue-book")
                .set("Cookie", adminCookies)
                .send({
                    bookCode: "BOOK-E2E-1",
                    borrowerEmail: mockUsers.member.email
                });

            assert.strictEqual(issueRes.status, 200);
            borrowTransactionId = issueRes.body.data._id;
        });

        await t.test("Check Renewal Status", async () => {
            const memberCookies = await getAuthCookies(mockUsers.member.email, mockUsers.member.password);
            const statusRes = await request(app)
                .get(`/api/v1/borrow/${borrowTransactionId}/renewal-status`)
                .set("Cookie", memberCookies);

            assert.strictEqual(statusRes.status, 200);
            assert.strictEqual(statusRes.body.data.isEligible, true);
        });

        await t.test("Successfully Renew Book", async () => {
            const memberCookies = await getAuthCookies(mockUsers.member.email, mockUsers.member.password);
            const renewRes = await request(app)
                .post(`/api/v1/borrow/${borrowTransactionId}/renew`)
                .set("Cookie", memberCookies);

            assert.strictEqual(renewRes.status, 200);
            assert.strictEqual(renewRes.body.data.renewalCount, 1);
        });

        await t.test("Block Renewal When Pending Reservations Exist", async () => {
            // Create a pending reservation for the book to block renewal
            await Reservation.create({
                user: newMemberId,
                isbn13: "9781234567890",
                status: "WAITING",
                queuePosition: 1
            });

            // Attempt to renew again -> should fail
            const memberCookies = await getAuthCookies(mockUsers.member.email, mockUsers.member.password);
            const renewRes = await request(app)
                .post(`/api/v1/borrow/${borrowTransactionId}/renew`)
                .set("Cookie", memberCookies);

            assert.strictEqual(renewRes.status, 400);
            assert.ok(renewRes.body.message.includes("There are pending reservations for this book. Renewal is blocked."));
        });
    });

    await t.test("6. Notifications Flow", async (t) => {
        await t.test("Verify Database Notification Creation", async () => {
            const memberUser = await User.findOne({ email: mockUsers.member.email });
            const notification = await Notification.findOne({
                type: "RENEWAL_APPROVED"
            });

            assert.ok(notification, "A notification of type RENEWAL_APPROVED should have been written to the DB");
            assert.strictEqual(notification.user.toString(), memberUser._id.toString());
            assert.ok(notification.title.includes("Renewal Approved"));
        });
    });

    await t.test("7. Reviews & Ratings Flow", async (t) => {
        await t.test("Submit Book Review", async () => {
            const memberCookies = await getAuthCookies(mockUsers.member.email, mockUsers.member.password);
            const reviewRes = await request(app)
                .post("/api/v1/reviews/books/9781234567890/reviews")
                .set("Cookie", memberCookies)
                .send({
                    rating: 5,
                    reviewText: "Incredible textbook, highly recommended!"
                });

            assert.strictEqual(reviewRes.status, 201);
            assert.strictEqual(reviewRes.body.data.rating, 5);
        });

        await t.test("Block Duplicate Book Reviews", async () => {
            const memberCookies = await getAuthCookies(mockUsers.member.email, mockUsers.member.password);
            const reviewRes = await request(app)
                .post("/api/v1/reviews/books/9781234567890/reviews")
                .set("Cookie", memberCookies)
                .send({
                    rating: 4,
                    reviewText: "Another duplicate review text."
                });

            assert.strictEqual(reviewRes.status, 400);
        });

        await t.test("Fetch Book Reviews", async () => {
            const reviewsRes = await request(app)
                .get("/api/v1/reviews/books/9781234567890/reviews");

            assert.strictEqual(reviewsRes.status, 200);
            assert.strictEqual(reviewsRes.body.data.totalReviews, 1);
            assert.strictEqual(reviewsRes.body.data.reviews[0].rating, 5);
        });
    });

    await t.test("8. Audit Logs Flow", async (t) => {
        await t.test("Verify Important Actions Log Events", async () => {
            const logs = await AuditLog.find({ actionType: "ADD_REVIEW" });
            assert.ok(logs.length > 0, "Audit logs should record ADD_REVIEW actions");
            assert.strictEqual(logs[0].entityType, "REVIEW");
        });
    });

    await t.test("9. Analytics Flow", async (t) => {
        await t.test("Retrieve Analytics Overview", async () => {
            const analyticsRes = await request(app)
                .get("/api/v1/analytics/overview")
                .set("Cookie", adminCookies);

            assert.strictEqual(analyticsRes.status, 200);
            assert.ok(analyticsRes.body.data.totals.issues >= 0);
            assert.ok(analyticsRes.body.data.totals.reservations >= 0);
        });
    });

    await t.test("10. AI Librarian Assistant Flow", async (t) => {
        await t.test("Verify Greeting Intent Chat Response", async () => {
            const chatRes = await request(app)
                .post("/api/v1/assistant/chat")
                .set("Cookie", userCookies)
                .send({ message: "Hello librarian" });

            assert.strictEqual(chatRes.status, 200);
            assert.strictEqual(chatRes.body.data.intent, "GREETING");
            assert.ok(chatRes.body.data.reply);
        });

        await t.test("Verify Policy Intent Chat Response", async () => {
            const chatRes = await request(app)
                .post("/api/v1/assistant/chat")
                .set("Cookie", userCookies)
                .send({ message: "What is the policy rules on book renewal?" });

            assert.strictEqual(chatRes.status, 200);
            assert.strictEqual(chatRes.body.data.intent, "GET_POLICY");
            assert.ok(chatRes.body.data.reply.includes("renew")); // verify it includes "renew"
        });
    });
});
