const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        variantName: {
            type: String,
            required: true,
            trim: true
        },

        variantValue: {
            type: String,
            required: true,
            trim: true
        },

        sku: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        additionalPrice: {
            type: Number,
            default: 0,
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

module.exports = mongoose.model("ProductVariant", productVariantSchema);