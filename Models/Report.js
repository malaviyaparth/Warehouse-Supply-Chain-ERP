const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: [
        "Inventory",
        "Purchase",
        "Sales",
        "Warehouse",
        "Profit"
      ],
      required: true
    },

    source: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sourceModel"
    },

    sourceModel: {
      type: String,
      enum: [
        "Inventory",
        "PurchaseOrder",
        "SalesOrder",
        "Warehouse"
      ]
    },

    generatedDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);