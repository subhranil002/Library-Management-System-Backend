import userRepository from "../repositories/user.repository.js";
import { ApiError } from "../utils/index.js";

class UserService {
    async getUserProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError("User profile not found", 404);
        }
        return user;
    }

    async updateProfile(userId, profileData) {
        const user = await userRepository.update(userId, profileData);
        if (!user) {
            throw new ApiError("Failed to update profile", 400);
        }
        return user;
    }
}

export default new UserService();
