import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
    {
        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false
        },
        actorRole: {
            type: String,
            required: false
        },
        actionType: {
            type: String,
            required: true
        },
        entityType: {
            type: String,
            required: true
        },
        entityId: {
            type: Schema.Types.Mixed, // Allows ObjectId or String based on entity
            required: false
        },
        before: {
            type: Schema.Types.Mixed,
            required: false
        },
        after: {
            type: Schema.Types.Mixed,
            required: false
        },
        ipAddress: {
            type: String,
            required: false
        },
        userAgent: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true // Automatically manages timestamp (createdAt, updatedAt)
    }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema, "audit_logs");
