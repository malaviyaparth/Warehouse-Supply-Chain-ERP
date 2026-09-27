const PurchaseOrder = require("../Models/PurchaseOrder");
const PurchaseRequest = require("../Models/PurchaseRequest");
const Vendor = require("../Models/Vendor");
const Warehouse = require("../Models/Warehouse");
const Product = require("../Models/Product");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const GoodsReceipt = require("../Models/GoodsReceipt");
const { validId } = require("../Utils/crudController");
const { runInTransaction } = require("../Utils/dbTransactions");
const { logAudit } = require("../Utils/auditLogger");

// 1. Create Purchase Order (One PO belongs to exactly one Vendor)
const create = async (req, res, next) => {
  try {
    const b = req.body;
    const vendorId = b.vendor || b.vendorId;
    const warehouseId = b.warehouse || b.warehouseId;

    if (!vendorId || !warehouseId || !Array.isArray(b.items) || !b.items.length) {
      return res.status(400).json({
        success: false,
        message: "vendor (or vendorId), warehouse (or warehouseId) and items are required.",
      });
    }

    if (!validId(vendorId) || !validId(warehouseId)) {
      return res.status(400).json({ success: false, message: "Invalid vendor or warehouse ID." });
    }

    const vendorDoc = await Vendor.findById(vendorId);
    if (!vendorDoc) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }
    if (vendorDoc.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Selected vendor is INACTIVE. Inactive vendors cannot be selected for new purchase orders.",
      });
    }

    const whDoc = await Warehouse.findById(warehouseId);
    if (!whDoc) {
      return res.status(404).json({ success: false, message: "Warehouse not found." });
    }
    if (whDoc.status === "INACTIVE") {
      return res.status(400).json({ success: false, message: "Selected warehouse is INACTIVE." });
    }

    const items = [];
    let total = 0;
    for (const i of b.items) {
      if (!validId(i.product)) {
        return res.status(400).json({ success: false, message: `Invalid Product ID: ${i.product}` });
      }
      const p = await Product.findById(i.product);
      if (!p) {
        return res.status(404).json({ success: false, message: `Product ${i.product} not found.` });
      }
      const qty = Number(i.quantity);
      const price = i.unitPrice === undefined ? p.unitPrice : Number(i.unitPrice);
      if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
        return res.status(400).json({ success: false, message: "Invalid item quantity or price." });
      }
      items.push({
        product: p._id,
        quantity: qty,
        unitPrice: price,
        receivedQuantity: 0,
      });
      total += qty * price;
    }

    const initialStatus = b.status && ["DRAFT", "PENDING"].includes(b.status.toUpperCase())
      ? b.status.toUpperCase()
      : "PENDING";

    const po = await PurchaseOrder.create({
      purchaseOrderNumber: b.purchaseOrderNumber || `PO-${Date.now()}`,
      purchaseRequest: b.purchaseRequest && validId(b.purchaseRequest) ? b.purchaseRequest : undefined,
      vendor: vendorDoc._id,
      warehouse: whDoc._id,
      createdBy: req.user?.id,
      expectedDate: b.expectedDate,
      items,
      totalAmount: total,
      remarks: b.remarks || "",
      status: initialStatus,
    });

    // If converted from Purchase Request, update PR status to CONVERTED_TO_PO
    if (b.purchaseRequest && validId(b.purchaseRequest)) {
      await PurchaseRequest.findByIdAndUpdate(b.purchaseRequest, {
        status: "CONVERTED_TO_PO",
      });
    }

    await logAudit({
      employeeId: req.user?.id,
      action: "PURCHASE_ORDER_CREATED",
      entityType: "PURCHASE_ORDER",
      entityId: po._id,
      description: `Purchase order ${po.purchaseOrderNumber} created with ${items.length} items for vendor ${vendorDoc.vendorName}.`,
      newData: po.toObject(),
      ipAddress: req.ip,
    });

    const populated = await PurchaseOrder.findById(po._id)
      .populate("vendor", "vendorName phone email")
      .populate("warehouse", "warehouseName location")
      .populate("items.product", "productName sku unitPrice")
      .populate("createdBy", "name email");

    // Critical rule: Creating a PO must NOT increase inventory.
    res.status(201).json({ success: true, data: populated });
  } catch (e) {
    next(e);
  }
};

// 2. List Purchase Orders
const list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status.toUpperCase();
    if (req.query.vendor) q.vendor = req.query.vendor;
    if (req.query.warehouse) q.warehouse = req.query.warehouse;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      PurchaseOrder.countDocuments(q),
      PurchaseOrder.find(q)
        .populate("vendor", "vendorName phone email")
        .populate("warehouse", "warehouseName location")
        .populate("items.product", "productName sku unitPrice")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      count: docs.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      data: docs,
    });
  } catch (e) {
    next(e);
  }
};

// 3. Get Single Purchase Order
const get = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Purchase Order ID." });
    }

    const doc = await PurchaseOrder.findById(req.params.id)
      .populate("vendor")
      .populate("warehouse")
      .populate("items.product")
      .populate("createdBy", "name email");

    if (!doc) {
      return res.status(404).json({ success: false, message: "Purchase order not found." });
    }

    res.json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};

// 4. Approve Purchase Order
const approve = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Purchase Order ID." });
    }

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase order not found." });
    }

    if (!["DRAFT", "PENDING"].includes(po.status)) {
      return res.status(400).json({
        success: false,
        message: `Only DRAFT or PENDING orders can be approved. Current status: ${po.status}.`,
      });
    }

    po.status = "APPROVED";
    await po.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "PURCHASE_ORDER_APPROVED",
      entityType: "PURCHASE_ORDER",
      entityId: po._id,
      description: `Purchase order ${po.purchaseOrderNumber} approved.`,
      ipAddress: req.ip,
    });

    // Critical rule: Approving a PO must NOT increase inventory.
    res.json({ success: true, message: "Purchase order approved successfully.", data: po });
  } catch (e) {
    next(e);
  }
};

// 5. Cancel Purchase Order
const cancel = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Purchase Order ID." });
    }

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase order not found." });
    }

    if (["RECEIVED", "CANCELLED"].includes(po.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status: ${po.status}.`,
      });
    }

    po.status = "CANCELLED";
    await po.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "PURCHASE_ORDER_CANCELLED",
      entityType: "PURCHASE_ORDER",
      entityId: po._id,
      description: `Purchase order ${po.purchaseOrderNumber} cancelled.`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Purchase order cancelled.", data: po });
  } catch (e) {
    next(e);
  }
};

// 6. Receive Goods against Purchase Order (Atomically using MongoDB Transaction)
const receive = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Purchase Order ID." });
    }

    const { items: receivedItems, remarks } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase order not found." });
    }

    if (["CANCELLED", "DRAFT"].includes(po.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot receive goods for an order with status: ${po.status}. Must be APPROVED or ORDERED.`,
      });
    }

    if (po.status === "RECEIVED") {
      return res.status(400).json({
        success: false,
        message: "Purchase order has already been fully received.",
      });
    }

    // Default to receiving all remaining if items array not provided
    const itemsToProcess = receivedItems && receivedItems.length
      ? receivedItems
      : po.items.map((i) => ({
          product: i.product,
          quantity: i.quantity - i.receivedQuantity,
        }));

    const result = await runInTransaction(async (session) => {
      const activePo = await PurchaseOrder.findById(po._id).session(session);
      const grItems = [];

      for (const rItem of itemsToProcess) {
        const poItem = activePo.items.find((i) => String(i.product) === String(rItem.product));
        if (!poItem) {
          throw new Error(`Product ${rItem.product} is not part of this Purchase Order.`);
        }

        const qtyToReceive = Number(rItem.quantity || rItem.receivedQuantity || 0);
        const remaining = poItem.quantity - poItem.receivedQuantity;

        if (qtyToReceive <= 0) continue;

        // Prevent Over-receiving
        if (qtyToReceive > remaining) {
          throw new Error(
            `Over-receiving prevented: Attempted to receive ${qtyToReceive} units, but only ${remaining} units remaining for product ${rItem.product}.`
          );
        }

        poItem.receivedQuantity += qtyToReceive;

        // Atomic Inventory Increase & Stock Movement
        let inv = await Inventory.findOne({
          product: rItem.product,
          warehouse: activePo.warehouse,
        }).session(session);

        if (!inv) {
          inv = new Inventory({
            product: rItem.product,
            warehouse: activePo.warehouse,
            quantity: 0,
            reservedStock: 0,
          });
        }

        const prev = inv.quantity;
        inv.quantity += qtyToReceive;
        await inv.save({ session });

        await StockMovement.create(
          [
            {
              product: rItem.product,
              warehouse: activePo.warehouse,
              type: "STOCK_IN",
              quantity: qtyToReceive,
              referenceType: "PURCHASE",
              referenceId: activePo._id,
              previousQuantity: prev,
              newQuantity: inv.quantity,
              performedBy: req.user?.id,
              remarks: remarks || `Goods received against PO ${activePo.purchaseOrderNumber}`,
            },
          ],
          { session }
        );

        grItems.push({
          product: rItem.product,
          orderedQuantity: poItem.quantity,
          receivedQuantity: qtyToReceive,
          damagedQuantity: 0,
        });
      }

      // Check if partially or fully received
      const allFullyReceived = activePo.items.every((i) => i.receivedQuantity >= i.quantity);
      activePo.status = allFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";
      await activePo.save({ session });

      // Create GoodsReceipt document
      const grDocs = await GoodsReceipt.create(
        [
          {
            purchaseOrder: activePo._id,
            warehouse: activePo.warehouse,
            receivedBy: req.user?.id,
            receiptDate: new Date(),
            items: grItems,
            remarks: remarks || `GRN for PO ${activePo.purchaseOrderNumber}`,
          },
        ],
        { session }
      );

      return { po: activePo, goodsReceipt: grDocs[0] };
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "GOODS_RECEIVED",
      entityType: "PURCHASE_ORDER",
      entityId: po._id,
      description: `Goods receipt processed for PO ${po.purchaseOrderNumber}. Status is now ${result.po.status}.`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Goods receipt processed successfully. Order status: ${result.po.status}.`,
      data: result.po,
      goodsReceipt: result.goodsReceipt,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  create,
  list,
  get,
  approve,
  cancel,
  receive,
};
