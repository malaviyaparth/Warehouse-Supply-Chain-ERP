const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            required: true
        },

        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        barcode: {
            type: String,
            unique: true,
            sparse: true
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },

        averageDailyDemand: {
            type: Number,
            default: 0,
            min: 0
        },

        leadTimeDays: {
            type: Number,
            default: 7,
            min: 0
        },

        safetyStock: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Product",
    productSchema
);