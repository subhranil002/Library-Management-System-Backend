import { Payment } from "../models/index.js";

class PaymentRepository {
    async create(paymentData) {
        return await Payment.create(paymentData);
    }

    async findById(id) {
        return await Payment.findById(id);
    }

    async findOne(query = {}) {
        return await Payment.findOne(query);
    }

    async find(query = {}, sort = { createdAt: -1 }) {
        return await Payment.find(query).sort(sort);
    }

    async update(id, updateData) {
        return await Payment.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );
    }
}

export default new PaymentRepository();
