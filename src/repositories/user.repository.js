import { User } from "../models/index.js";

class UserRepository {
    async findById(id) {
        return await User.findById(id).select("-password -refreshToken");
    }

    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async create(userData) {
        return await User.create(userData);
    }

    async update(id, updateData) {
        return await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select("-password -refreshToken");
    }

    async delete(id) {
        return await User.findByIdAndDelete(id);
    }
}

export default new UserRepository();
