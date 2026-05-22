import QRCode from "qrcode";
import { uploadImage } from "./fileHandler.js";
import fs from "fs";
import path from "path";

/**
 * Generates a QR Code for a given payload and uploads it to Cloudinary.
 * @param {Object} payload - The data to encode in the QR code
 * @param {string} prefix - Prefix for the filename
 * @returns {Promise<string>} The secure URL of the uploaded QR code
 */
export const generateAndUploadQR = async (payload, prefix = "qr") => {
    try {
        const jsonString = JSON.stringify(payload);
        const tempFilePath = path.join(process.cwd(), "public", "temp", `${prefix}_${Date.now()}.png`);

        // Ensure temp directory exists
        const dir = path.dirname(tempFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Generate QR code to file
        await QRCode.toFile(tempFilePath, jsonString, {
            errorCorrectionLevel: "H",
            margin: 2,
            width: 300,
            color: {
                dark: "#000000",
                light: "#FFFFFF"
            }
        });

        // Upload to Cloudinary
        const uploadResult = await uploadImage(tempFilePath);
        
        return uploadResult.secure_url;
    } catch (error) {
        console.error("QR Generation Error:", error);
        throw new Error("Failed to generate and upload QR code");
    }
};
