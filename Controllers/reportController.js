const Product = require("../Models/Product");
const Inventory = require("../Models/Inventory");
const PurchaseOrder = require("../Models/PurchaseOrder");
const SalesOrder = require("../Models/SalesOrder");
const StockMovement = require("../Models/StockMovement");
const Vendor = require("../Models/Vendor");
const Customer = require("../Models/Customer");
const AuditLog = require("../Models/AuditLog");
const { normalizeRole, ROLES } = require("../Middleware/roleMiddleware");

const report = async (req, res, next) => {
  try {
    const userRole = normalizeRole(req.user?.roleName);
    const type = (req.params.type || "INVENTORY").toUpperCase();

    // Enforce role domain access for reports
    if (userRole !== ROLES.SUPER_ADMIN) {
      if (
        userRole === ROLES.PURCHASE_MANAGER &&
        !["PURCHASE", "VENDOR", "PURCHASE_TRENDS"].includes(type)
      ) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Purchase Manager cannot access ${type} reports.`,
        });
      }
      if (
        userRole === ROLES.WAREHOUSE_MANAGER &&
        !["INVENTORY", "STOCK_TRANSFER", "LOW_STOCK", "VALUATION"].includes(type)
      ) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Warehouse Manager cannot access ${type} reports.`,
        });
      }
      if (
        userRole === ROLES.SALES_MANAGER &&
        !["SALES", "SALES_TRENDS", "CUSTOMER"].includes(type)
      ) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Sales Manager cannot access ${type} reports.`,
        });
      }
    }

    let data;
    switch (type) {
      case "INVENTORY":
        data = await Inventory.find()
          .populate("product", "productName sku unitPrice costPrice")
          .populate("warehouse", "warehouseName location");
        break;

      case "LOW_STOCK":
        const allInv = await Inventory.find()
          .populate("product", "productName sku costPrice unitPrice averageDailyDemand leadTimeDays safetyStock reorderPoint")
          .populate("warehouse", "warehouseName location");
        data = allInv
          .filter((i) => {
            if (!i.product) return false;
            const reorder = i.product.reorderPoint !== undefined && i.product.reorderPoint !== null
              ? i.product.reorderPoint
              : (i.product.averageDailyDemand || 0) * (i.product.leadTimeDays || 0) + (i.product.safetyStock || 0);
            return (i.quantity - (i.reservedStock || 0)) <= reorder;
          })
          .map((i) => {
            const reorder = i.product.reorderPoint !== undefined && i.product.reorderPoint !== null
              ? i.product.reorderPoint
              : (i.product.averageDailyDemand || 0) * (i.product.leadTimeDays || 0) + (i.product.safetyStock || 0);
            return {
              product: i.product.productName,
              sku: i.product.sku,
              warehouse: i.warehouse?.warehouseName,
              quantity: i.quantity,
              reservedStock: i.reservedStock || 0,
              availableStock: i.quantity - (i.reservedStock || 0),
              reorderPoint: reorder,
            };
          });
        break;

      case "VALUATION":
        const valuationInv = await Inventory.find()
          .populate("product", "productName sku costPrice unitPrice")
          .populate("warehouse", "warehouseName location");
        data = valuationInv.map((i) => {
          const cost = i.product?.costPrice || 0;
          const totalValuation = (i.quantity || 0) * cost;
          return {
            product: i.product?.productName || "Unknown",
            sku: i.product?.sku || "",
            warehouse: i.warehouse?.warehouseName || "Unknown",
            quantity: i.quantity,
            costPrice: cost,
            totalValuation,
          };
        });
        break;

      case "PURCHASE":
        data = await PurchaseOrder.find()
          .populate("vendor", "vendorName phone email")
          .populate("warehouse", "warehouseName location");
        break;

      case "PURCHASE_TRENDS":
        data = await PurchaseOrder.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              totalSpend: { $sum: "$totalAmount" },
              totalOrders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;

      case "SALES":
        data = await SalesOrder.find()
          .populate("customer", "customerName phone email")
          .populate("warehouse", "warehouseName location");
        break;

      case "SALES_TRENDS":
        data = await SalesOrder.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              totalRevenue: { $sum: "$totalAmount" },
              totalOrders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;

      case "STOCK_TRANSFER":
        data = await StockMovement.find({
          type: { $in: ["TRANSFER_IN", "TRANSFER_OUT"] },
        })
          .populate("product", "productName sku")
          .populate("warehouse", "warehouseName");
        break;

      case "VENDOR":
        data = await Vendor.find();
        break;

      case "CUSTOMER":
        data = await Customer.find();
        break;

      case "AUDIT":
        data = await AuditLog.find()
          .populate("employee", "name email department role")
          .sort({ timestamp: -1 })
          .limit(100);
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: `Unsupported report type: ${type}` });
    }

    res.json({ success: true, reportType: type, count: Array.isArray(data) ? data.length : 1, data });
  } catch (e) {
    next(e);
  }
};

module.exports = { report };

