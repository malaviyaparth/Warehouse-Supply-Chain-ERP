const mongoose = require("mongoose");

const goodsReceiptSchema = new mongoose.Schema(
    {
        purchaseOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            required: true
        },

        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true
        },

        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        receiptDate: {
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

                orderedQuantity: {
                    type: Number,
                    required: true,
                    min: 0
                },

                receivedQuantity: {
                    type: Number,
                    required: true,
                    min: 0
                },

                damagedQuantity: {
                    type: Number,
                    default: 0,
                    min: 0
                }
            }
        ],

        remarks: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "GoodsReceipt",
    goodsReceiptSchema
);