const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: { type: String, unique: true, sparse: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "PCS", trim: true },
    averageDailyDemand: { type: Number, default: 0, min: 0 },
    leadTimeDays: { type: Number, default: 7, min: 0 },
    safetyStock: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
