const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    condition: {
      type: String,
      enum: ["GOOD", "RESTOCKABLE", "DAMAGED"],
      default: "GOOD",
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrder",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    items: {
      type: [returnItemSchema],
      validate: [(v) => v && v.length > 0, "At least one item must be returned"],
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "APPROVED",
        "RECEIVED",
        "INSPECTED",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "REQUESTED",
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

returnSchema.index({ salesOrder: 1 });
returnSchema.index({ status: 1 });

module.exports = mongoose.model("Return", returnSchema);

