import dotenv from "dotenv";
dotenv.config();

export const ENV = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    MONGO_URI: process.env.MONGO_URI,
    DB_NAME: process.env.DB_NAME || "BookSphere",
    REDIS_URI: process.env.REDIS_URI || "redis://localhost:6379",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_SECRET_KEY: process.env.CLOUDINARY_SECRET_KEY,
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || "BookSphere",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_EXPIRE || "6h",
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || "24h",
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USERNAME: process.env.SMTP_USERNAME,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    FINE_AMOUNT_PER_DAY: Number(process.env.FINE_AMOUNT_PER_DAY) || 2,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykey",
    RAZORPAY_SECRET: process.env.RAZORPAY_SECRET || "dummysecret"
};
