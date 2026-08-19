const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
  {
    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },

    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },

    transferDate: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: [
        "Requested",
        "Approved",
        "Dispatched",
        "Received",
        "Rejected",
        "Cancelled"
      ],
      default: "Requested"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StockTransfer",
  stockTransferSchema
);