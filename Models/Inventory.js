const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse ID is required"],
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },

    quantity: {
      type: Number,
      default: 0,
      min: [0, "Physical quantity cannot be negative"],
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: [0, "Reserved stock cannot be negative"],
    },

    reorderPoint: {
      type: Number,
      default: 0,
      min: [0, "Reorder point cannot be negative"],
    },

    reorderLevel: {
      type: Number,
      default: 0,
      min: [0, "Reorder level cannot be negative"],
    },

    safetyStock: {
      type: Number,
      default: 0,
      min: [0, "Safety stock cannot be negative"],
    },

    damagedStock: {
      type: Number,
      default: 0,
      min: [0, "Damaged stock cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for clean multi-warehouse identification
inventorySchema.virtual("productId").get(function () {
  return this.product;
});

inventorySchema.virtual("warehouseId").get(function () {
  return this.warehouse;
});

// Business Rule: availableStock = quantity - reservedStock
// Computed on-the-fly; never stored as independently editable to prevent sync drift.
inventorySchema.virtual("availableStock").get(function () {
  const qty = typeof this.quantity === "number" ? this.quantity : 0;
  const reserved = typeof this.reservedStock === "number" ? this.reservedStock : 0;
  return Math.max(0, qty - reserved);
});

// Sync reorderPoint and reorderLevel for backward compatibility
inventorySchema.pre("save", function () {
  if (this.reorderPoint !== undefined && (this.reorderLevel === undefined || this.reorderLevel === 0)) {
    this.reorderLevel = this.reorderPoint;
  } else if (this.reorderLevel !== undefined && (this.reorderPoint === undefined || this.reorderPoint === 0)) {
    this.reorderPoint = this.reorderLevel;
  }
});

// Enforce unique combination of productId + warehouseId
inventorySchema.index(
  {
    warehouse: 1,
    product: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Inventory", inventorySchema);
