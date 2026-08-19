const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reportType: {
            type: String,
            enum: [
                "INVENTORY",
                "PURCHASE",
                "SALES",
                "STOCK_TRANSFER",
                "VENDOR",
                "WAREHOUSE",
                "FINANCIAL"
            ],
            required: true
        },

        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee"
        },

        generatedDate: {
            type: Date,
            default: Date.now
        },

        periodStart: {
            type: Date
        },

        periodEnd: {
            type: Date
        },

        fileUrl: {
            type: String
        },

        status: {
            type: String,
            enum: ["GENERATING", "COMPLETED", "FAILED"],
            default: "GENERATING"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Report", reportSchema);