const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
    {
        sourceWarehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true
        },

        destinationWarehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true
        },

        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        transferDate: {
            type: Date,
            default: Date.now
        },

        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                receivedQuantity: {
                    type: Number,
                    default: 0,
                    min: 0
                }
            }
        ],

        status: {
            type: String,
            enum: [
                "REQUESTED",
                "APPROVED",
                "IN_TRANSIT",
                "COMPLETED",
                "REJECTED",
                "CANCELLED"
            ],
            default: "REQUESTED"
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee"
        },

        completedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "StockTransfer",
    stockTransferSchema
);