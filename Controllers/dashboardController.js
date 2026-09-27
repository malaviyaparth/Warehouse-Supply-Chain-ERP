const Product = require("../Models/Product");
const Warehouse = require("../Models/Warehouse");
const Vendor = require("../Models/Vendor");
const Customer = require("../Models/Customer");
const Employee = require("../Models/Employee");
const PurchaseOrder = require("../Models/PurchaseOrder");
const PurchaseRequest = require("../Models/PurchaseRequest");
const GoodsReceipt = require("../Models/GoodsReceipt");
const SalesOrder = require("../Models/SalesOrder");
const Invoice = require("../Models/Invoice");
const Delivery = require("../Models/Delivery");
const Return = require("../Models/Return");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const StockTransfer = require("../Models/StockTransfer");
const AuditLog = require("../Models/AuditLog");
const { normalizeRole, ROLES } = require("../Middleware/roleMiddleware");

const getDashboard = async (req, res, next) => {
  try {
    const userRole = normalizeRole(req.user?.roleName);

    // Common Low-stock calculation helper
    const getLowStockItems = async () => {
      const invList = await Inventory.find()
        .populate("product", "productName sku costPrice unitPrice averageDailyDemand leadTimeDays safetyStock reorderPoint")
        .populate("warehouse", "warehouseName location");

      return invList
        .filter((i) => {
          if (!i.product) return false;
          const reorder = i.product.reorderPoint !== undefined && i.product.reorderPoint !== null
            ? i.product.reorderPoint
            : (i.product.averageDailyDemand || 0) * (i.product.leadTimeDays || 0) + (i.product.safetyStock || 0);
          const available = i.quantity - (i.reservedStock || 0);
          return available <= reorder;
        })
        .map((i) => {
          const reorder = i.product.reorderPoint !== undefined && i.product.reorderPoint !== null
            ? i.product.reorderPoint
            : (i.product.averageDailyDemand || 0) * (i.product.leadTimeDays || 0) + (i.product.safetyStock || 0);
          return {
            product: i.product.productName,
            sku: i.product.sku,
            warehouse: i.warehouse?.warehouseName,
            warehouseId: i.warehouse?._id,
            quantity: i.quantity,
            reservedStock: i.reservedStock || 0,
            availableStock: i.quantity - (i.reservedStock || 0),
            reorderPoint: reorder,
          };
        });
    };

    // 1. PURCHASE MANAGER DASHBOARD
    if (userRole === ROLES.PURCHASE_MANAGER) {
      const [
        pendingPRs,
        allPOs,
        pendingReceivingPOs,
        overduePOs,
        vendorCount,
        topVendors,
        monthlyTrends,
      ] = await Promise.all([
        PurchaseRequest.find({ status: "PENDING" }).populate("warehouse items.product requestedBy").sort({ createdAt: -1 }),
        PurchaseOrder.find().populate("vendor warehouse").sort({ createdAt: -1 }).limit(20),
        PurchaseOrder.find({ status: { $in: ["APPROVED", "ORDERED", "PARTIALLY_RECEIVED"] } }).populate("vendor warehouse"),
        PurchaseOrder.find({
          expectedDate: { $lt: new Date() },
          status: { $nin: ["RECEIVED", "CANCELLED"] },
        }).populate("vendor warehouse"),
        Vendor.countDocuments({ status: "ACTIVE" }),
        PurchaseOrder.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          { $group: { _id: "$vendor", totalSpend: { $sum: "$totalAmount" }, orderCount: { $sum: 1 } } },
          { $sort: { totalSpend: -1 } },
          { $limit: 5 },
          { $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendorDetails" } },
          { $unwind: "$vendorDetails" },
        ]),
        PurchaseOrder.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              total: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 12 },
        ]),
      ]);

      const lowStock = await getLowStockItems();

      return res.json({
        success: true,
        role: userRole,
        data: {
          pendingPurchaseRequests: pendingPRs,
          pendingPurchaseRequestsCount: pendingPRs.length,
          purchaseOrders: allPOs,
          pendingReceiving: pendingReceivingPOs,
          pendingReceivingCount: pendingReceivingPOs.length,
          overduePOs,
          overduePOsCount: overduePOs.length,
          vendorSummary: {
            activeVendors: vendorCount,
            topVendors,
          },
          purchaseTrends: monthlyTrends,
          lowStockProducts: lowStock,
        },
      });
    }

    // 2. WAREHOUSE MANAGER DASHBOARD
    if (userRole === ROLES.WAREHOUSE_MANAGER) {
      const [
        allInventory,
        recentMovements,
        pendingTransfers,
        recentGoodsReceipts,
      ] = await Promise.all([
        Inventory.find().populate("product", "productName sku costPrice").populate("warehouse", "warehouseName location"),
        StockMovement.find().populate("product", "productName sku").populate("warehouse", "warehouseName").sort({ createdAt: -1 }).limit(15),
        StockTransfer.find({ status: { $in: ["REQUESTED", "APPROVED", "IN_TRANSIT"] } }).populate("sourceWarehouse destinationWarehouse items.product"),
        GoodsReceipt.find().populate("purchaseOrder warehouse receivedBy").sort({ createdAt: -1 }).limit(10),
      ]);

      let totalValuation = 0;
      let totalStock = 0;
      let totalReserved = 0;
      let totalDamaged = 0;

      const warehouseBreakdown = {};

      for (const inv of allInventory) {
        const qty = inv.quantity || 0;
        const reserved = inv.reservedStock || 0;
        const damaged = inv.damagedStock || 0;
        const cost = inv.product?.costPrice || 0;

        totalStock += qty;
        totalReserved += reserved;
        totalDamaged += damaged;
        totalValuation += qty * cost;

        const whName = inv.warehouse?.warehouseName || "Unassigned";
        if (!warehouseBreakdown[whName]) {
          warehouseBreakdown[whName] = { totalQuantity: 0, reservedStock: 0, damagedStock: 0, valuation: 0 };
        }
        warehouseBreakdown[whName].totalQuantity += qty;
        warehouseBreakdown[whName].reservedStock += reserved;
        warehouseBreakdown[whName].damagedStock += damaged;
        warehouseBreakdown[whName].valuation += qty * cost;
      }

      const lowStock = await getLowStockItems();

      return res.json({
        success: true,
        role: userRole,
        data: {
          warehouseInventory: {
            totalStock,
            totalReserved,
            totalDamaged,
            warehouseBreakdown,
          },
          inventoryValuation: totalValuation,
          lowStockProducts: lowStock,
          stockMovements: recentMovements,
          pendingTransfers,
          pendingTransfersCount: pendingTransfers.length,
          goodsReceipts: recentGoodsReceipts,
        },
      });
    }

    // 3. SALES MANAGER DASHBOARD
    if (userRole === ROLES.SALES_MANAGER) {
      const [
        allSalesOrders,
        pendingFulfillments,
        invoices,
        deliveries,
        returns,
        customerCount,
        topCustomers,
        salesTrends,
      ] = await Promise.all([
        SalesOrder.find().populate("customer warehouse items.product").sort({ createdAt: -1 }).limit(20),
        SalesOrder.find({ status: { $in: ["PENDING", "CONFIRMED", "RESERVED", "PROCESSING"] } }).populate("customer warehouse"),
        Invoice.find().populate("salesOrder customer").sort({ createdAt: -1 }).limit(15),
        Delivery.find().populate("salesOrder customer warehouse assignedEmployee").sort({ createdAt: -1 }).limit(15),
        Return.find().populate("salesOrder customer warehouse items.product").sort({ createdAt: -1 }).limit(15),
        Customer.countDocuments({ status: "ACTIVE" }),
        SalesOrder.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          { $group: { _id: "$customer", totalSpent: { $sum: "$totalAmount" }, orderCount: { $sum: 1 } } },
          { $sort: { totalSpent: -1 } },
          { $limit: 5 },
          { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customerDetails" } },
          { $unwind: "$customerDetails" },
        ]),
        SalesOrder.aggregate([
          { $match: { status: { $ne: "CANCELLED" } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              revenue: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 12 },
        ]),
      ]);

      const reservedOrders = allSalesOrders.filter((so) => so.status === "RESERVED");

      return res.json({
        success: true,
        role: userRole,
        data: {
          salesOrders: allSalesOrders,
          pendingFulfillment: pendingFulfillments,
          pendingFulfillmentCount: pendingFulfillments.length,
          reservations: {
            orders: reservedOrders,
            count: reservedOrders.length,
          },
          invoices,
          deliveries,
          returns,
          customerSummary: {
            activeCustomers: customerCount,
            topCustomers,
          },
          salesTrends,
        },
      });
    }

    // 4. SUPER ADMIN DASHBOARD (Default / Super Admin)
    const [
      totalProducts,
      totalWarehouses,
      totalEmployees,
      totalVendors,
      totalCustomers,
      allInventory,
      salesStats,
      purchaseStats,
      pendingPRs,
      pendingPOs,
      pendingTransfers,
      pendingFulfillments,
      pendingDeliveries,
      recentAuditLogs,
    ] = await Promise.all([
      Product.countDocuments({ status: "ACTIVE" }),
      Warehouse.countDocuments({ status: "ACTIVE" }),
      Employee.countDocuments({ status: "ACTIVE" }),
      Vendor.countDocuments({ status: "ACTIVE" }),
      Customer.countDocuments({ status: "ACTIVE" }),
      Inventory.find().populate("product", "costPrice"),
      SalesOrder.aggregate([
        { $match: { status: { $ne: "CANCELLED" } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { status: { $ne: "CANCELLED" } } },
        { $group: { _id: null, totalSpend: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 } } },
      ]),
      PurchaseRequest.countDocuments({ status: "PENDING" }),
      PurchaseOrder.countDocuments({ status: { $in: ["PENDING", "APPROVED", "ORDERED", "PARTIALLY_RECEIVED"] } }),
      StockTransfer.countDocuments({ status: { $in: ["REQUESTED", "APPROVED", "IN_TRANSIT"] } }),
      SalesOrder.countDocuments({ status: { $in: ["PENDING", "CONFIRMED", "RESERVED", "PROCESSING"] } }),
      Delivery.countDocuments({ status: { $in: ["PENDING", "ASSIGNED", "IN_TRANSIT"] } }),
      AuditLog.find().populate("employee", "name email department role").sort({ timestamp: -1 }).limit(10),
    ]);

    let totalValuation = 0;
    let totalStock = 0;
    let totalReserved = 0;
    let totalDamaged = 0;

    for (const inv of allInventory) {
      const qty = inv.quantity || 0;
      totalStock += qty;
      totalReserved += inv.reservedStock || 0;
      totalDamaged += inv.damagedStock || 0;
      totalValuation += qty * (inv.product?.costPrice || 0);
    }

    const lowStock = await getLowStockItems();

    res.json({
      success: true,
      role: userRole,
      data: {
        totalProducts,
        totalWarehouses,
        totalEmployees,
        totalVendors,
        totalCustomers,
        inventoryOverview: {
          totalStock,
          totalReserved,
          totalDamaged,
          totalValuation,
        },
        purchaseOverview: {
          totalSpend: purchaseStats[0]?.totalSpend || 0,
          totalOrders: purchaseStats[0]?.totalOrders || 0,
          pendingPOs,
        },
        salesOverview: {
          totalRevenue: salesStats[0]?.totalRevenue || 0,
          totalOrders: salesStats[0]?.totalOrders || 0,
          pendingFulfillments,
        },
        lowStockItems: lowStock,
        pendingOperations: {
          pendingPurchaseRequests: pendingPRs,
          pendingPurchaseOrders: pendingPOs,
          pendingTransfers,
          pendingFulfillments,
          pendingDeliveries,
        },
        auditActivity: recentAuditLogs,
        // Legacy summary structure for backward-compatible frontend components
        summary: {
          totalProducts,
          totalWarehouses,
          totalVendors,
          totalCustomers,
          pendingPurchases: pendingPOs,
          pendingPurchaseRequests: pendingPRs,
          pendingSalesOrders: pendingFulfillments,
          lowStockCount: lowStock.length,
          totalSales: salesStats[0]?.totalRevenue || 0,
          totalPurchase: purchaseStats[0]?.totalSpend || 0,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

module.exports = { getDashboard };

