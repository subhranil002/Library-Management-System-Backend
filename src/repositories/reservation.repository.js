import { Reservation } from "../models/index.js";

class ReservationRepository {
    async create(reservationData) {
        return await Reservation.create(reservationData);
    }

    async findById(id) {
        return await Reservation.findById(id);
    }

    async findOne(query = {}) {
        return await Reservation.findOne(query);
    }

    async find(query = {}, sort = { createdAt: -1 }) {
        return await Reservation.find(query).sort(sort);
    }

    async update(id, updateData) {
        return await Reservation.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );
    }

    async countDocuments(query = {}) {
        return await Reservation.countDocuments(query);
    }
}

export default new ReservationRepository();
