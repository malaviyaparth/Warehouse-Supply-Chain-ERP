const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    estimatedUnitPrice: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true, trim: true },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    reason: { type: String, enum: ["LOW_STOCK", "MANUAL"], default: "MANUAL" },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CONVERTED"],
      default: "PENDING",
    },
    remarks: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PurchaseRequest", purchaseRequestSchema);
