const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
    {
        warehouseName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        capacity: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Warehouse", warehouseSchema);