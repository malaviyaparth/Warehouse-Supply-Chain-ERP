const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRequest",
      required: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    orderDate: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Ordered",
        "Received",
        "Cancelled"
      ],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PurchaseOrder",
  purchaseOrderSchema
);