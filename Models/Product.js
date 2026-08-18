const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand"
        },

        productName: {
            type: String,
            required: true,
            trim: true
        },

        sku: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        barcode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },

        unit: {
            type: String,
            enum: ["PCS", "KG", "GRAM", "LITER", "METER", "BOX", "PACK"],
            default: "PCS"
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

module.exports = mongoose.model("Product", productSchema);