const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        quantity: {
            type: Number,
            default: 0,
            min: 0
        },

        reservedStock: {
            type: Number,
            default: 0,
            min: 0
        },

        damagedStock: {
            type: Number,
            default: 0,
            min: 0
        },

        reorderLevel: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// One product should have only one inventory record
// inside one warehouse.
inventorySchema.index(
    {
        warehouse: 1,
        product: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("Inventory", inventorySchema);
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0
    },

    damagedStock: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

inventorySchema.index(
  { warehouse: 1, product: 1 },
  { unique: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);