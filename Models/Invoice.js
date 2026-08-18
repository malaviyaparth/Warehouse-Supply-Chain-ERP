const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
    {
        salesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesOrder",
            required: true,
            unique: true
        },

        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        invoiceDate: {
            type: Date,
            default: Date.now
        },

        subtotal: {
            type: Number,
            required: true,
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
            required: true,
            min: 0
        },

        paymentStatus: {
            type: String,
            enum: [
                "UNPAID",
                "PARTIALLY_PAID",
                "PAID",
                "OVERDUE"
            ],
            default: "UNPAID"
        },

        paymentMethod: {
            type: String,
            enum: [
                "CASH",
                "CARD",
                "BANK_TRANSFER",
                "UPI",
                "CREDIT"
            ]
        },

        paidAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Invoice", invoiceSchema);