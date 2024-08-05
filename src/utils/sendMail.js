import ApiError from "./ApiError.js";
import smtpTransport from "../config/smtp.config.js";
import constants from "../constants.js";

// Validate email
export const validateEmail = email => {
    const isValidEmail = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    return isValidEmail.test(email);
};

export const sendEmail = async (email, subject, html) => {
    try {
        // Verify connection
        await new Promise((resolve, reject) => {
            smtpTransport.verify((error, success) => {
                if (error) {
                    reject(new ApiError(error, 500));
                } else {
                    resolve();
                }
            });
        });

        // Send email
        const response = await smtpTransport.sendMail({
            from: `TheOpenPage <${constants.SMTP_USERNAME}>`,
            to: email,
            bcc: constants.SMTP_USERNAME,
            subject: subject,
            html: html
        });

        // return boolean value
        return response.accepted.length > 0 ? true : false;
    } catch (error) {
        throw new ApiError(error, 500);
    }
};
