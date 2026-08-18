const mongoose = require("mongoose");

const salesOrderSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },

        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
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

                totalPrice: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],

        subtotal: {
            type: Number,
            default: 0,
            min: 0
        },

        taxAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        discountAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        totalAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED"
            ],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("SalesOrder", salesOrderSchema);