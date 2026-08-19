const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        department: {
            type: String,
            enum: [
                "PURCHASE",
                "WAREHOUSE",
                "SALES",
                "FINANCE",
                "ADMIN",
                "MANAGEMENT"
            ],
            required: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
            required: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Employee", employeeSchema);