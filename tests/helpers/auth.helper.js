import request from "supertest";
import app from "../../src/app.js";

/**
 * Log in a user and return the Cookie headers
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<string[]>} Cookies array containing accessToken and refreshToken
 */
export async function getAuthCookies(email, password) {
    const response = await request(app)
        .post("/api/v1/user/login")
        .send({ email, password });

    if (response.status !== 200) {
        throw new Error(`Failed to login for ${email}: ${response.body.message}`);
    }

    return response.headers["set-cookie"] || [];
}
