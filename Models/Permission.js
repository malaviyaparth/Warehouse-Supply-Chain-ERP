const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    permissionName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // e.g. "inventory.update", "purchase.approve"
    },
    module: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // e.g. "INVENTORY", "PURCHASE", "SALES"
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", permissionSchema);
