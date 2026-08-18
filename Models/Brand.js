const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
    {
        brandName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
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

module.exports = mongoose.model("Brand", brandSchema);