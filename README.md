# BookSphere Backend

> A robust, scalable RESTful backend for a comprehensive library management system.

This project serves as the backend engine for a digital library platform (internally referenced as BookSphere). It provides APIs for user authentication, role-based access control, book cataloging, transaction management (issuance and returns), and automated fine handling with integrated payment processing.

## 🌟 Key Features

- **Role-Based Authentication**: Secure JWT-based authentication supporting multiple roles (`USER`, `LIBRARIAN`, `ADMIN`).
- **User Management**: OTP-based email verification, profile management, and avatar uploads.
- **Book Inventory Management**: Comprehensive CRUD operations for the library catalog, including thumbnail uploads and stock tracking.
- **Advanced Search**: Search for books by title, author, or genre using MongoDB aggregation pipelines.
- **Circulation Management**: Issue and return workflows, including limits on borrowed books and overdue checks.
- **Automated Fine System**: Automatically calculates fines based on overdue days.
- **Payment Gateway Integration**: Seamless fine payment processing using Razorpay.
- **Cloud Storage Integration**: Uploads user avatars and book thumbnails directly to Cloudinary.

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcrypt for password hashing
- **File Uploads**: Multer (local processing) & Cloudinary (cloud storage)
- **Email Service**: Nodemailer (SMTP)
- **Payment Gateway**: Razorpay
- **Date Manipulation**: date-fns

## 📂 Architecture / Folder Structure

```text
.
├── public/                 # Static files and temp directories (e.g., local uploads)
├── src/
│   ├── config/             # Connection setups (MongoDB, Cloudinary, Razorpay, SMTP)
│   ├── controllers/        # Business logic for routes
│   ├── middlewares/        # Express middlewares (Auth, Error Handling, Multer)
│   ├── models/             # Mongoose schemas (Book, User, Transaction, Fine, etc.)
│   ├── routes/             # API route definitions (versioned, e.g., v1)
│   ├── utils/              # Utility classes (ApiError, ApiResponse) & helper functions
│   ├── app.js              # Express app configuration
│   ├── constants.js        # Global constants mapping to environment variables
│   └── index.js            # Entry point, DB connection, and server startup
├── templates/              # Static HTML templates (e.g., payment checkout page)
├── .env.sample             # Template for environment variables
└── package.json            # Project dependencies and scripts
```

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js** (v18.x or higher recommended)
- **MongoDB** instance (Local or Atlas)
- **Cloudinary** account (for image hosting)
- **Razorpay** account (for payment gateway testing)
- **SMTP Server** access (e.g., Gmail App Password)

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/subhranil002/BookSphere-Backend.git
   cd BookSphere-Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables. You can copy the structure from `.env.sample`.

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port for the server to run on | `3000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `CORS_ORIGIN` | Allowed origin for CORS | `*` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `DB_NAME` | Name of the MongoDB database | `BookSphere` |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_api_key` |
| `CLOUDINARY_SECRET_KEY`| Cloudinary API secret | `your_secret_key` |
| `CLOUDINARY_FOLDER` | Folder in Cloudinary to store images| `BookSphere` |
| `ACCESS_TOKEN_SECRET` | Secret key for signing Access JWTs | `your_secret` |
| `ACCESS_TOKEN_EXPIRE` | Expiry time for Access Token | `6h` |
| `REFRESH_TOKEN_SECRET`| Secret key for signing Refresh JWTs | `your_secret` |
| `REFRESH_TOKEN_EXPIRE`| Expiry time for Refresh Token | `24h` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_SECRET` | Razorpay Key Secret | `your_secret` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` |
| `SMTP_USERNAME` | SMTP email address | `email@example.com` |
| `SMTP_PASSWORD` | SMTP password / app password | `password123` |
| `FINE_AMOUNT_PER_DAY` | Amount to charge per day overdue | `2` |

## 💻 Running the Application

### Development Mode
Runs the application using `nodemon` for auto-reloading during development.
```bash
npm run dev
```

### Production Mode
Runs the standard Node process.
```bash
npm start
```

## 📜 Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start`| `node src/index.js` | Starts the production server |
| `dev`  | `nodemon src/index.js`| Starts the dev server with hot-reloading |

## 🔗 API Documentation (Summary)

All APIs are prefixed with `/api/v1`. 

### Auth & Users (`/api/v1/user`)
- `POST /register`: Register a new user (requires Admin/Librarian role).
- `POST /login`: Authenticate and receive JWT tokens via cookies.
- `GET /logout`: Clear cookies and invalidate refresh token.
- `POST /send-otp`: Request an OTP for email verification.
- `POST /verify-otp`: Verify user email using OTP.
- `GET /current-user`: Fetch current logged-in user details.
- `PUT /change-password`: Change user password.
- `PUT /update-profile`: Update user profile details.
- `GET /borrowed-books`: View currently borrowed books for the logged-in user.

### Books & Catalog (`/api/v1/book`)
- `POST /add-book`: Add a new book to the catalog (Admin/Librarian).
- `GET /search-books`: Search by `query` or `genre`.
- `GET /get-book/:isbn13`: Get detailed information and availability of a book.
- `POST /issue-book`: Issue a book to a verified user.
- `GET /return-book/:bookCode`: Process a book return.

### Payments & Fines (`/api/v1/payment`)
- `GET /create/overdue-payment/:book_transaction_id`: Automatically calculate and generate a Razorpay order for an overdue book.
- `POST /verify`: Verify Razorpay payment signatures and clear fines.

> Note: For detailed request/response structures, refer to the source code schemas or import a Postman collection if provided.

## 🔐 Authentication Flow

1. **Login**: User submits credentials. If valid, `accessToken` and `refreshToken` are generated.
2. **Cookies**: Tokens are set as HTTP-only, secure cookies.
3. **Validation**: Protected routes use the `isLoggedIn` middleware to verify the `accessToken`.
4. **Role Check**: Routes needing specific privileges use `authorizedRoles('ADMIN', 'LIBRARIAN')`.
5. **Token Refresh**: If the access token expires, a request to `/api/v1/user/refresh-token` validates the refresh token in the database and issues new tokens.

## 🛡️ Error Handling & Validation

- All asynchronous controllers are wrapped in a custom `asyncHandler` to catch unhandled promise rejections.
- Custom `ApiError` class is used to throw standardized HTTP errors.
- Global `errorMiddleware` intercepts these errors and formats them into a consistent JSON response.
- Extensive manual validation is performed within controllers prior to database execution.

## 🔮 Future Improvements

- Implement a robust Swagger/OpenAPI documentation interface.
- Add comprehensive Unit and Integration testing (e.g., using Jest and Supertest).
- Containerize the application using Docker and Docker Compose.
- Introduce an admin dashboard frontend.

## 📄 License

This project is licensed under the GPL-3.0-only License. See the `LICENSE` file for more details.

## 👨‍💻 Maintainer

- **Subhranil Chakraborty** - [GitHub Profile](https://github.com/subhranil002)