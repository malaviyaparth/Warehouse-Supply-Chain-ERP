const mongoose = require("mongoose");

const salesOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned"
      ],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SalesOrder",
  salesOrderSchema
);