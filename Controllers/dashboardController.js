const Product = require("../Models/Product"),
  Warehouse = require("../Models/Warehouse"),
  Vendor = require("../Models/Vendor"),
  PurchaseOrder = require("../Models/PurchaseOrder"),
  PurchaseRequest = require("../Models/PurchaseRequest"),
  SalesOrder = require("../Models/SalesOrder"),
  Inventory = require("../Models/Inventory"),
  StockMovement = require("../Models/StockMovement");
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalWarehouses,
      totalVendors,
      pendingPurchases,
      pendingPurchaseRequests,
      pendingSalesOrders,
      inventory,
    ] = await Promise.all([
      Product.countDocuments({ status: "ACTIVE" }),
      Warehouse.countDocuments({ status: "ACTIVE" }),
      Vendor.countDocuments({ status: "ACTIVE" }),
      PurchaseOrder.countDocuments({
        status: { $in: ["PENDING", "APPROVED", "PARTIALLY_RECEIVED"] },
      }),
      PurchaseRequest.countDocuments({ status: "PENDING" }),
      SalesOrder.countDocuments({
        status: { $in: ["PENDING", "CONFIRMED", "PROCESSING"] },
      }),
      Inventory.find()
        .populate(
          "product",
          "productName sku averageDailyDemand leadTimeDays safetyStock",
        )
        .populate("warehouse", "warehouseName"),
    ]);
    const low = inventory
      .filter(
        (i) =>
          i.product &&
          i.quantity - i.reservedStock <=
            (i.product.averageDailyDemand || 0) *
              (i.product.leadTimeDays || 0) +
              (i.product.safetyStock || 0),
      )
      .map((i) => ({
        product: i.product.productName,
        sku: i.product.sku,
        warehouse: i.warehouse?.warehouseName,
        quantity: i.quantity,
        reservedStock: i.reservedStock,
        availableStock: i.quantity - i.reservedStock,
        reorderPoint:
          (i.product.averageDailyDemand || 0) * (i.product.leadTimeDays || 0) +
          (i.product.safetyStock || 0),
      }));
    const [sales, purchase] = await Promise.all([
      SalesOrder.aggregate([
        { $match: { status: { $ne: "CANCELLED" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { status: { $ne: "CANCELLED" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);
    const recent = await StockMovement.find()
      .populate("product", "productName sku")
      .populate("warehouse", "warehouseName")
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalWarehouses,
          totalVendors,
          pendingPurchases,
          pendingPurchaseRequests,
          pendingSalesOrders,
          lowStockCount: low.length,
          totalSales: sales[0]?.total || 0,
          totalPurchase: purchase[0]?.total || 0,
        },
        lowStockProducts: low,
        recentStockMovements: recent,
      },
    });
  } catch (e) {
    next(e);
  }
};
module.exports = { getDashboard };
