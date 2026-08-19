const mongoose = require("mongoose");

const purchaseRequestSchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true
        },

        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        requestDate: {
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

                estimatedPrice: {
                    type: Number,
                    min: 0
                }
            }
        ],

        reason: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "APPROVED",
                "REJECTED",
                "CONVERTED_TO_ORDER",
                "CANCELLED"
            ],
            default: "PENDING"
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee"
        },

        approvedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PurchaseRequest",
    purchaseRequestSchema
);