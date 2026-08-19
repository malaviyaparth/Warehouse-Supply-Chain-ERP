const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
    {
        purchaseRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseRequest"
        },

        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        orderDate: {
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

                unitPrice: {
                    type: Number,
                    required: true,
                    min: 0
                },

                receivedQuantity: {
                    type: Number,
                    default: 0,
                    min: 0
                }
            }
        ],

        totalAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "DRAFT",
                "PLACED",
                "PARTIALLY_RECEIVED",
                "RECEIVED",
                "CANCELLED"
            ],
            default: "DRAFT"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PurchaseOrder",
    purchaseOrderSchema
);