const mongoose = require("mongoose");

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: "InventoryPro Global Logistics",
      trim: true,
    },
    companyEmail: {
      type: String,
      default: "contact@inventorypro.com",
      trim: true,
    },
    companyPhone: {
      type: String,
      default: "+1 (800) 555-0199",
      trim: true,
    },
    companyAddress: {
      type: String,
      default: "742 Evergreen Terrace, Logistics Hub, IL 62704",
      trim: true,
    },
    taxNumber: {
      type: String,
      default: "US-EIN-9923841",
      trim: true,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
    },
    systemConfig: {
      defaultReorderThreshold: {
        type: Number,
        default: 15,
        min: 0,
      },
      lowStockAlertEnabled: {
        type: Boolean,
        default: true,
      },
      defaultTaxRate: {
        type: Number,
        default: 8.5,
        min: 0,
      },
      invoicePrefix: {
        type: String,
        default: "INV-",
        trim: true,
      },
      poPrefix: {
        type: String,
        default: "PO-",
        trim: true,
      },
      soPrefix: {
        type: String,
        default: "SO-",
        trim: true,
      },
      notificationEmail: {
        type: String,
        default: "alerts@inventorypro.com",
        trim: true,
      },
      enableEmailAlerts: {
        type: Boolean,
        default: false,
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanySettings", companySettingsSchema);
