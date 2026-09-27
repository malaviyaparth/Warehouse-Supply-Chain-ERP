const cron = require("node-cron");
const Product = require("../Models/Product");
const Inventory = require("../Models/Inventory");
const Warehouse = require("../Models/Warehouse");
const Vendor = require("../Models/Vendor");
const PurchaseRequest = require("../Models/PurchaseRequest");
const PurchaseOrder = require("../Models/PurchaseOrder");
const AuditLog = require("../Models/AuditLog");
const Employee = require("../Models/Employee");

/**
 * Scan per-warehouse inventory against Reorder Point (ROP).
 * Generates idempotent PurchaseRequest if available stock falls below ROP.
 */
const runLowStockScan = async () => {
  console.log("[CRON] Initiating per-warehouse low stock scan...");
  try {
    const inventories = await Inventory.find()
      .populate("product")
      .populate("warehouse");

    // Find system or admin employee for job attribution
    const systemUser = await Employee.findOne().sort({ createdAt: 1 });
    let createdCount = 0;

    for (const inv of inventories) {
      if (!inv.product || !inv.warehouse) continue;
      if (inv.product.status === "INACTIVE" || inv.warehouse.status === "INACTIVE") continue;

      const demand = inv.product.averageDailyDemand || 0;
      const leadTime = inv.product.leadTimeDays || 7;
      const safety = inv.product.safetyStock || 0;

      // Reorder point: explicit reorderPoint from product or warehouse level, else formula
      const rop = inv.product.reorderPoint !== undefined && inv.product.reorderPoint !== null
        ? inv.product.reorderPoint
        : (inv.reorderLevel > 0 ? inv.reorderLevel : demand * leadTime + safety);

      // availableStock = quantity - reservedStock
      const available = (inv.quantity || 0) - (inv.reservedStock || 0);

      if (available <= rop) {
        // Idempotency check: check if an active request already exists for this (product, warehouse)
        // Possible active states: PENDING, APPROVED, CONVERTED_TO_PO
        const existingActiveRequest = await PurchaseRequest.findOne({
          warehouse: inv.warehouse._id,
          status: { $in: ["PENDING", "APPROVED", "CONVERTED_TO_PO"] },
          "items.product": inv.product._id,
        });

        if (!existingActiveRequest) {
          // Calculate reorder replenishment quantity (minimum 2 weeks demand or 20 units)
          const replenishmentQty = Math.max(20, Math.ceil(demand * leadTime * 2) || 25);

          const prNumber = `PR-AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const pr = await PurchaseRequest.create({
            requestNumber: prNumber,
            warehouse: inv.warehouse._id,
            requestedBy: systemUser?._id,
            reason: "LOW_STOCK",
            priority: available <= 0 ? "URGENT" : "HIGH",
            status: "PENDING",
            remarks: `Automated reorder: Available (${available}) <= ROP (${rop})`,
            items: [
              {
                product: inv.product._id,
                quantity: replenishmentQty,
                estimatedUnitPrice: inv.product.costPrice || inv.product.unitPrice || 0,
              },
            ],
          });

          await AuditLog.create({
            employee: systemUser?._id,
            action: "AUTO_REORDER_TRIGGERED",
            entityType: "PURCHASE_REQUEST",
            entityId: pr._id,
            description: `Auto PR ${prNumber} created for ${inv.product.productName} at ${inv.warehouse.warehouseName}`,
            newData: {
              product: inv.product.productName,
              warehouse: inv.warehouse.warehouseName,
              availableStock: available,
              reorderPoint: rop,
              replenishmentQty,
            },
            timestamp: new Date(),
          });

          createdCount++;
        }
      }
    }

    console.log(`[CRON] Low stock scan complete. Created ${createdCount} automated purchase requests.`);
    return { success: true, createdCount };
  } catch (error) {
    console.error("[CRON ERROR] Low stock scan failed:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Scan for overdue purchase orders where expectedDate < today and status is not RECEIVED/CANCELLED.
 * Marks/flags them as overdue.
 */
const runOverduePurchaseScan = async () => {
  console.log("[CRON] Checking overdue purchase orders...");
  try {
    const today = new Date();
    const updateResult = await PurchaseOrder.updateMany(
      {
        expectedDate: { $lt: today },
        status: { $nin: ["RECEIVED", "CANCELLED"] },
      },
      {
        $set: { isOverdue: true },
      }
    );

    const overduePOs = await PurchaseOrder.find({
      expectedDate: { $lt: today },
      status: { $nin: ["RECEIVED", "CANCELLED"] },
    })
      .populate("vendor", "vendorName email")
      .populate("warehouse", "warehouseName");

    if (overduePOs.length > 0) {
      console.log(`[CRON] Detected and flagged ${overduePOs.length} overdue purchase orders.`);
    }
    return { success: true, count: overduePOs.length, modifiedCount: updateResult.modifiedCount, data: overduePOs };
  } catch (error) {
    console.error("[CRON ERROR] Overdue PO scan failed:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize background scheduled tasks
 */
const initScheduledJobs = () => {
  // Run low-stock scan every 4 hours: 0 */4 * * *
  cron.schedule("0 */4 * * *", () => {
    runLowStockScan();
  });

  // Run overdue purchase scan once daily at 00:00 (midnight)
  cron.schedule("0 0 * * *", () => {
    runOverduePurchaseScan();
  });

  console.log("[CRON] Scheduled jobs initialized (Low Stock scan every 4h, Overdue PO scan daily).");
};

module.exports = {
  initScheduledJobs,
  runLowStockScan,
  runOverduePurchaseScan,
};

