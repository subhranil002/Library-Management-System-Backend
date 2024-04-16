import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Delete local files
export const deleteLocalFiles = filePaths => {
    try {
        if (filePaths && filePaths.length > 0) {
            filePaths.forEach(filePath => {
                if (filePath != "") {
                    fs.unlinkSync(filePath);
                }
            });
        }
    } catch (error) {
        console.log("Error while deleting local files: ", error);
    }
};

export const uploadImage = async localFilePath => {
    // Check if localFilePath is empty
    if (localFilePath == "") return null;

    try {
        // Upload image
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image",
            folder: "BusGo-Backend",
            transformation: [
                {
                    width: 200,
                    height: 200,
                    crop: "fill",
                    gravity: "faces:center"
                }
            ]
        });

        // Delete local files
        deleteLocalFiles([localFilePath]);

        // Return public_id and secure_url
        return {
            public_id: response.public_id,
            secure_url: response.secure_url
        };
    } catch (error) {
        deleteLocalFiles([localFilePath]);
        console.log("Error while uploading to Cloudinary: ", error);
    }
};

export const deleteImage = async publicId => {
    try {
        // Check if publicId is empty
        if (publicId == "") return true;

        // Delete image from Cloudinary
        await cloudinary.uploader.destroy(publicId);

        return true;
    } catch (error) {
        console.error("Error while deleting image from Cloudinary: ", error);
    }
};
