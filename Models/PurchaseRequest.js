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
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    items: {
      type: [itemSchema],
      validate: [(v) => v && v.length > 0, "At least one item is required in a purchase request"],
    },
    reason: {
      type: String,
      trim: true,
      default: "MANUAL",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "CONVERTED", "CONVERTED_TO_PO"],
      default: "PENDING",
    },
    remarks: { type: String, trim: true },
  },
  { timestamps: true },
);

// Virtual aliases
purchaseRequestSchema.virtual("warehouseId").get(function () {
  return this.warehouse;
});

module.exports = mongoose.model("PurchaseRequest", purchaseRequestSchema);
