import { AuditLog } from "../models/auditLog.model.js";

/**
 * Reusable utility function to log audit events
 * @param {Object} req - Express request object for extracting IP and User Agent
 * @param {Object} params - Audit log details
 * @param {string} [params.actorId] - User ID performing the action
 * @param {string} [params.actorRole] - Role of the user
 * @param {string} params.actionType - Action being performed (e.g., LOGIN, ADD_BOOK)
 * @param {string} params.entityType - Type of entity affected (e.g., USER, BOOK)
 * @param {string|any} [params.entityId] - ID of the affected entity
 * @param {Object} [params.before] - State before the action
 * @param {Object} [params.after] - State after the action
 */
const logAuditEvent = async (req, params) => {
    try {
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress;
        const userAgent = req.headers["user-agent"];

        // Extract actor from req.user if not explicitly passed
        const actorId = params.actorId || (req.user ? req.user._id : undefined);
        const actorRole = params.actorRole || (req.user ? req.user.role : undefined);

        await AuditLog.create({
            actorId,
            actorRole,
            actionType: params.actionType,
            entityType: params.entityType,
            entityId: params.entityId,
            before: params.before,
            after: params.after,
            ipAddress,
            userAgent
        });
    } catch (error) {
        // Log the error but DO NOT throw. Audit failure should not break main flow.
        console.error("Failed to write audit log:", error);
    }
};

export default logAuditEvent;
