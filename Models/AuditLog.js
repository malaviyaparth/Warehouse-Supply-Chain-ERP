const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        action: {
            type: String,
            required: true,
            trim: true
        },

        entityType: {
            type: String,
            required: true,
            trim: true
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId
        },

        description: {
            type: String,
            trim: true
        },

        oldData: {
            type: mongoose.Schema.Types.Mixed
        },

        newData: {
            type: mongoose.Schema.Types.Mixed
        },

        ipAddress: {
            type: String
        },

        timestamp: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);