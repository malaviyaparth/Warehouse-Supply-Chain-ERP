const mongoose = require("mongoose");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const Product = require("../Models/Product");
const Warehouse = require("../Models/Warehouse");
const { validId } = require("../Utils/crudController");
const { logAudit } = require("../Utils/auditLogger");
const { runInTransaction } = require("../Utils/dbTransactions");

// 1. List inventory across warehouses or by query
const list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.product) {
      q.product = req.query.product;
    }
    if (req.query.warehouse) {
      q.warehouse = req.query.warehouse;
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      Inventory.countDocuments(q),
      Inventory.find(q)
        .populate("product", "productName sku unitPrice barcode unit status safetyStock leadTimeDays")
        .populate("warehouse", "warehouseName location capacity status")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    // Optional low-stock filtering
    let resultDocs = docs;
    if (req.query.lowStock === "true") {
      resultDocs = docs.filter(
        (doc) => (doc.availableStock || 0) <= (doc.reorderPoint || doc.reorderLevel || 10)
      );
    }

    res.json({
      success: true,
      count: resultDocs.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      data: resultDocs,
    });
  } catch (e) {
    next(e);
  }
};

// 2. Get Single Inventory Record by ID
const get = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid inventory ID." });
    }

    const doc = await Inventory.findById(req.params.id)
      .populate("product")
      .populate("warehouse");

    if (!doc) {
      return res.status(404).json({ success: false, message: "Inventory record not found." });
    }

    res.json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};

// 3. Multi-Warehouse Inventory API: Get all inventory for a specific warehouse
const getByWarehouse = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    if (!validId(warehouseId)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse ID." });
    }

    const wh = await Warehouse.findById(warehouseId);
    if (!wh) {
      return res.status(404).json({ success: false, message: "Warehouse facility not found." });
    }

    const q = { warehouse: warehouseId };
    if (req.query.product && validId(req.query.product)) {
      q.product = req.query.product;
    }

    const docs = await Inventory.find(q)
      .populate("product", "productName sku unitPrice barcode unit status safetyStock")
      .populate("warehouse", "warehouseName location capacity status")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      warehouse: {
        id: wh._id,
        name: wh.warehouseName,
        location: wh.location,
        status: wh.status,
      },
      count: docs.length,
      data: docs,
    });
  } catch (e) {
    next(e);
  }
};

// 4. Multi-Warehouse Inventory API: Get inventory for specific productId + warehouseId
const getByWarehouseProduct = async (req, res, next) => {
  try {
    const { warehouseId, productId } = req.params;
    if (!validId(warehouseId) || !validId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse or product ID." });
    }

    const doc = await Inventory.findOne({ warehouse: warehouseId, product: productId })
      .populate("product")
      .populate("warehouse");

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "No inventory record found for this product in the specified warehouse.",
      });
    }

    res.json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};

// 5. Upsert / Set Inventory Thresholds and Baseline
const upsert = async (req, res, next) => {
  try {
    const {
      product,
      productId,
      warehouse,
      warehouseId,
      quantity = 0,
      reservedStock = 0,
      damagedStock = 0,
      reorderPoint = 0,
      reorderLevel = 0,
      safetyStock = 0,
    } = req.body;

    const targetProduct = product || productId;
    const targetWarehouse = warehouse || warehouseId;

    if (!validId(targetProduct) || !validId(targetWarehouse)) {
      return res.status(400).json({
        success: false,
        message: "Valid product and warehouse IDs are required.",
      });
    }

    const prodDoc = await Product.findById(targetProduct);
    if (!prodDoc) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const whDoc = await Warehouse.findById(targetWarehouse);
    if (!whDoc) {
      return res.status(404).json({ success: false, message: "Warehouse not found." });
    }

    const numQty = Math.max(0, Number(quantity) || 0);
    const numReserved = Math.max(0, Number(reservedStock) || 0);
    const numReorder = Math.max(0, Number(reorderPoint || reorderLevel) || 0);
    const numSafety = Math.max(0, Number(safetyStock) || 0);
    const numDamaged = Math.max(0, Number(damagedStock) || 0);

    const doc = await Inventory.findOneAndUpdate(
      { product: targetProduct, warehouse: targetWarehouse },
      {
        $set: {
          quantity: numQty,
          reservedStock: numReserved,
          damagedStock: numDamaged,
          reorderPoint: numReorder,
          reorderLevel: numReorder,
          safetyStock: numSafety,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    )
      .populate("product", "productName sku unitPrice")
      .populate("warehouse", "warehouseName location");

    res.status(200).json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};

// 6. Safe Physical Stock In Intake
const stockIn = async (req, res, next) => {
  try {
    const {
      product,
      productId,
      warehouse,
      warehouseId,
      quantity,
      remarks,
      poRef,
      referenceType,
      referenceId,
    } = req.body;

    const targetProduct = product || productId;
    const targetWarehouse = warehouse || warehouseId;
    const qty = Number(quantity);

    if (!targetProduct || !targetWarehouse || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid product, warehouse, and positive quantity are required.",
      });
    }

    if (!validId(targetProduct) || !validId(targetWarehouse)) {
      return res.status(400).json({ success: false, message: "Invalid product or warehouse ID." });
    }

    const prodDoc = await Product.findById(targetProduct);
    if (!prodDoc) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    if (prodDoc.status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Cannot stock in an INACTIVE product." });
    }

    const whDoc = await Warehouse.findById(targetWarehouse);
    if (!whDoc) {
      return res.status(404).json({ success: false, message: "Warehouse facility not found." });
    }
    if (whDoc.status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Cannot stock in to an INACTIVE warehouse." });
    }

    const refType = poRef ? "PURCHASE" : (referenceType || "MANUAL");

    // Prevent duplicate processing if reference is supplied
    if (referenceId && validId(referenceId)) {
      const existingMovement = await StockMovement.findOne({
        product: targetProduct,
        warehouse: targetWarehouse,
        type: "STOCK_IN",
        referenceType: refType,
        referenceId: referenceId,
      });
      if (existingMovement) {
        return res.status(409).json({
          success: false,
          message: "Duplicate intake prevented: This reference transaction has already been processed.",
          movement: existingMovement,
        });
      }
    }

    const result = await runInTransaction(async (session) => {
      let inv = await Inventory.findOne({ product: targetProduct, warehouse: targetWarehouse }).session(session);
      if (!inv) {
        inv = new Inventory({
          product: targetProduct,
          warehouse: targetWarehouse,
          quantity: 0,
          reservedStock: 0,
          reorderPoint: prodDoc.safetyStock || 10,
          reorderLevel: prodDoc.safetyStock || 10,
          safetyStock: prodDoc.safetyStock || 10,
        });
      }

      const prev = inv.quantity;
      inv.quantity += qty;
      await inv.save({ session });

      const movementDocs = await StockMovement.create(
        [
          {
            product: targetProduct,
            warehouse: targetWarehouse,
            type: "STOCK_IN",
            quantity: qty,
            referenceType: refType,
            referenceId: referenceId && validId(referenceId) ? referenceId : null,
            previousQuantity: prev,
            newQuantity: inv.quantity,
            performedBy: req.user?.id,
            remarks: remarks || "Physical stock intake",
          },
        ],
        { session }
      );

      return { inv, movement: movementDocs[0], prev };
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "STOCK_IN",
      entityType: "INVENTORY",
      entityId: result.inv._id,
      description: `Inbound intake: +${qty} of ${prodDoc.productName} into ${whDoc.warehouseName}`,
      oldData: { quantity: result.prev },
      newData: { quantity: result.inv.quantity },
      ipAddress: req.ip,
    });

    const populated = await Inventory.findById(result.inv._id)
      .populate("product")
      .populate("warehouse");

    res.status(201).json({
      success: true,
      message: "Stock successfully added to warehouse inventory.",
      data: populated,
      movement: result.movement,
    });
  } catch (e) {
    next(e);
  }
};

// 7. Safe Physical Stock Out Intake
const stockOut = async (req, res, next) => {
  try {
    const {
      product,
      productId,
      warehouse,
      warehouseId,
      quantity,
      reason,
      remarks,
      referenceType,
      referenceId,
    } = req.body;

    const targetProduct = product || productId;
    const targetWarehouse = warehouse || warehouseId;
    const qty = Number(quantity);

    if (!targetProduct || !targetWarehouse || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid product, warehouse, and positive quantity are required.",
      });
    }

    if (!validId(targetProduct) || !validId(targetWarehouse)) {
      return res.status(400).json({ success: false, message: "Invalid product or warehouse ID." });
    }

    const prodDoc = await Product.findById(targetProduct);
    if (!prodDoc) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const whDoc = await Warehouse.findById(targetWarehouse);
    if (!whDoc) {
      return res.status(404).json({ success: false, message: "Warehouse facility not found." });
    }

    const invCheck = await Inventory.findOne({ product: targetProduct, warehouse: targetWarehouse });
    if (!invCheck) {
      return res.status(404).json({
        success: false,
        message: "No inventory record exists for this product in the specified warehouse.",
      });
    }

    // Business rule: availableStock = quantity - reservedStock
    const available = (invCheck.quantity || 0) - (invCheck.reservedStock || 0);
    if (available < qty || invCheck.quantity < qty) {
      return res.status(409).json({
        success: false,
        message: `Insufficient available stock in this warehouse. Available to promise: ${Math.max(0, available)}, Requested: ${qty}`,
      });
    }

    const refType = referenceType || "MANUAL";

    const result = await runInTransaction(async (session) => {
      const inv = await Inventory.findOne({ product: targetProduct, warehouse: targetWarehouse }).session(session);
      if (!inv) throw new Error("Inventory record not found during transaction");

      const currAvailable = (inv.quantity || 0) - (inv.reservedStock || 0);
      if (currAvailable < qty || inv.quantity < qty) {
        throw new Error(`Insufficient stock. Current available: ${currAvailable}, Requested: ${qty}`);
      }

      const prev = inv.quantity;
      inv.quantity -= qty;

      // Absolute business rule: Never allow negative physical stock
      if (inv.quantity < 0) {
        throw new Error("Physical inventory quantity cannot be negative.");
      }

      await inv.save({ session });

      const movementDocs = await StockMovement.create(
        [
          {
            product: targetProduct,
            warehouse: targetWarehouse,
            type: "STOCK_OUT",
            quantity: qty,
            referenceType: refType,
            referenceId: referenceId && validId(referenceId) ? referenceId : null,
            previousQuantity: prev,
            newQuantity: inv.quantity,
            performedBy: req.user?.id,
            remarks: reason || remarks || "Physical stock outbound picking",
          },
        ],
        { session }
      );

      return { inv, movement: movementDocs[0], prev };
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "STOCK_OUT",
      entityType: "INVENTORY",
      entityId: result.inv._id,
      description: `Outbound stock deduction: -${qty} units of ${prodDoc.productName} from ${whDoc.warehouseName}. Reason: ${reason || "Outbound picking"}`,
      oldData: { quantity: result.prev },
      newData: { quantity: result.inv.quantity },
      ipAddress: req.ip,
    });

    const populated = await Inventory.findById(result.inv._id)
      .populate("product")
      .populate("warehouse");

    res.json({
      success: true,
      message: "Stock successfully deducted from warehouse.",
      data: populated,
      movement: result.movement,
    });
  } catch (e) {
    next(e);
  }
};

// 8. Safe Stock Adjustment
const adjust = async (req, res, next) => {
  try {
    const { quantity, reason, remarks, product, productId, warehouse, warehouseId, referenceId } = req.body;

    const targetProduct = product || productId;
    const targetWarehouse = warehouse || warehouseId;

    let targetInvId = req.params.id;
    let invRecord = null;

    if (targetInvId && validId(targetInvId)) {
      invRecord = await Inventory.findById(targetInvId);
    } else if (targetProduct && targetWarehouse && validId(targetProduct) && validId(targetWarehouse)) {
      invRecord = await Inventory.findOne({ product: targetProduct, warehouse: targetWarehouse });
    }

    if (!invRecord) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found for adjustment.",
      });
    }

    const newQty = Number(quantity);
    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({
        success: false,
        message: "Target quantity must be a non-negative number >= 0.",
      });
    }

    // Business rule: Cannot adjust physical stock below currently reserved stock
    if (newQty < (invRecord.reservedStock || 0)) {
      return res.status(400).json({
        success: false,
        message: `Cannot adjust physical quantity below currently reserved stock (${invRecord.reservedStock}). Release reservations first.`,
      });
    }

    const prev = invRecord.quantity;
    const delta = Math.abs(newQty - prev);

    if (delta === 0) {
      const currentPop = await Inventory.findById(invRecord._id).populate("product").populate("warehouse");
      return res.json({
        success: true,
        message: "Inventory is already at the specified target quantity.",
        data: currentPop,
      });
    }

    const result = await runInTransaction(async (session) => {
      const inv = await Inventory.findById(invRecord._id).session(session);
      inv.quantity = newQty;
      await inv.save({ session });

      const movementDocs = await StockMovement.create(
        [
          {
            product: inv.product,
            warehouse: inv.warehouse,
            type: "ADJUSTMENT",
            quantity: delta,
            referenceType: "ADJUSTMENT",
            referenceId: referenceId && validId(referenceId) ? referenceId : null,
            previousQuantity: prev,
            newQuantity: newQty,
            performedBy: req.user?.id,
            remarks: reason || remarks || "Reconciliation adjustment",
          },
        ],
        { session }
      );

      return { inv, movement: movementDocs[0] };
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "STOCK_ADJUSTMENT",
      entityType: "INVENTORY",
      entityId: result.inv._id,
      description: `Manual stock adjustment from ${prev} to ${newQty}. Reason: ${reason || "Cycle count audit"}`,
      oldData: { quantity: prev },
      newData: { quantity: newQty },
      ipAddress: req.ip,
    });

    const populated = await Inventory.findById(result.inv._id)
      .populate("product")
      .populate("warehouse");

    res.json({
      success: true,
      message: "Inventory adjusted and reconciled successfully.",
      data: populated,
      previousQuantity: prev,
      movement: result.movement,
    });
  } catch (e) {
    next(e);
  }
};

// 9. Damaged Stock Quarantine Management
const recordDamaged = async (req, res, next) => {
  try {
    const { product, productId, warehouse, warehouseId, quantity, reason } = req.body;
    const targetProduct = product || productId;
    const targetWarehouse = warehouse || warehouseId;
    const qty = Number(quantity);

    if (!targetProduct || !targetWarehouse || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid product, warehouse, and positive quantity are required.",
      });
    }

    const inv = await Inventory.findOne({ product: targetProduct, warehouse: targetWarehouse });
    if (!inv) {
      return res.status(404).json({ success: false, message: "Inventory record not found." });
    }

    const available = (inv.quantity || 0) - (inv.reservedStock || 0);
    if (available < qty || inv.quantity < qty) {
      return res.status(409).json({
        success: false,
        message: `Insufficient clean stock to quarantine as damaged. Available: ${Math.max(0, available)}, Requested: ${qty}`,
      });
    }

    const prev = inv.quantity;

    const result = await runInTransaction(async (session) => {
      const invDoc = await Inventory.findById(inv._id).session(session);
      invDoc.quantity -= qty;
      invDoc.damagedStock = (invDoc.damagedStock || 0) + qty;
      await invDoc.save({ session });

      const movementDocs = await StockMovement.create(
        [
          {
            product: targetProduct,
            warehouse: targetWarehouse,
            type: "DAMAGED",
            quantity: qty,
            referenceType: "MANUAL",
            previousQuantity: prev,
            newQuantity: invDoc.quantity,
            performedBy: req.user?.id,
            remarks: reason || "Quarantined damaged stock",
          },
        ],
        { session }
      );

      return { inv: invDoc, movement: movementDocs[0] };
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "STOCK_DAMAGED",
      entityType: "INVENTORY",
      entityId: result.inv._id,
      description: `Damaged stock quarantined: ${qty} units. Reason: ${reason || "Damage report"}`,
      oldData: { quantity: prev },
      newData: { quantity: result.inv.quantity, damagedStock: result.inv.damagedStock },
      ipAddress: req.ip,
    });

    const populated = await Inventory.findById(result.inv._id)
      .populate("product")
      .populate("warehouse");

    res.json({
      success: true,
      message: "Damaged stock recorded and isolated from available inventory.",
      data: populated,
      movement: result.movement,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  list,
  get,
  getByWarehouse,
  getByWarehouseProduct,
  upsert,
  stockIn,
  stockOut,
  adjust,
  recordDamaged,
};
