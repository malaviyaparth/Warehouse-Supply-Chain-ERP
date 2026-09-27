const PurchaseRequest = require("../Models/PurchaseRequest");
const Product = require("../Models/Product");
const Warehouse = require("../Models/Warehouse");
const { validId } = require("../Utils/crudController");
const { logAudit } = require("../Utils/auditLogger");

const create = async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.warehouse || !Array.isArray(b.items) || !b.items.length) {
      return res.status(400).json({
        success: false,
        message: "warehouse and items are required.",
      });
    }

    if (!validId(b.warehouse)) {
      return res.status(400).json({ success: false, message: "Invalid Warehouse ID." });
    }

    const wh = await Warehouse.findById(b.warehouse);
    if (!wh) {
      return res.status(404).json({ success: false, message: "Warehouse not found." });
    }
    if (wh.status === "INACTIVE") {
      return res.status(400).json({ success: false, message: "Cannot create purchase request for an INACTIVE warehouse." });
    }

    const processedItems = [];
    for (const i of b.items) {
      if (!validId(i.product)) {
        return res.status(400).json({ success: false, message: `Invalid Product ID: ${i.product}` });
      }
      const p = await Product.findById(i.product);
      if (!p) {
        return res.status(404).json({ success: false, message: `Product ${i.product} not found.` });
      }
      const qty = Number(i.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item quantity must be a positive number greater than zero.",
        });
      }
      processedItems.push({
        product: p._id,
        quantity: qty,
        estimatedUnitPrice: Number(i.estimatedUnitPrice || p.unitPrice || 0),
      });
    }

    const d = await PurchaseRequest.create({
      requestNumber: b.requestNumber || `PR-${Date.now()}`,
      warehouse: b.warehouse,
      requestedBy: req.user?.id,
      items: processedItems,
      reason: b.reason || "MANUAL",
      priority: b.priority ? b.priority.toUpperCase() : "MEDIUM",
      status: "PENDING",
      remarks: b.remarks || "",
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "PURCHASE_REQUEST_CREATED",
      entityType: "PURCHASE_REQUEST",
      entityId: d._id,
      description: `Purchase request ${d.requestNumber} created with ${d.items.length} items.`,
      newData: d.toObject(),
      ipAddress: req.ip,
    });

    const populated = await PurchaseRequest.findById(d._id)
      .populate("warehouse", "warehouseName location")
      .populate("requestedBy", "name email department")
      .populate("items.product", "productName sku unitPrice");

    // Creating a Purchase Request does NOT increase inventory
    res.status(201).json({ success: true, data: populated });
  } catch (e) {
    next(e);
  }
};

const list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status.toUpperCase();
    if (req.query.warehouse) q.warehouse = req.query.warehouse;
    if (req.query.priority) q.priority = req.query.priority.toUpperCase();

    const d = await PurchaseRequest.find(q)
      .populate("warehouse", "warehouseName location")
      .populate("requestedBy", "name email department")
      .populate("items.product", "productName sku unitPrice")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Purchase Request ID." });
    }

    const d = await PurchaseRequest.findById(req.params.id)
      .populate("warehouse", "warehouseName location")
      .populate("requestedBy", "name email department")
      .populate("items.product", "productName sku unitPrice");

    if (!d) {
      return res.status(404).json({ success: false, message: "Purchase request not found." });
    }

    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};

const changeStatus = (targetStatus) => async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Purchase Request ID." });
    }

    const d = await PurchaseRequest.findById(req.params.id);
    if (!d) {
      return res.status(404).json({ success: false, message: "Purchase request not found." });
    }

    if (d.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Only PENDING purchase requests can be transitioned. Current status: ${d.status}.`,
      });
    }

    d.status = targetStatus;
    if (req.body.remarks) d.remarks = req.body.remarks;
    await d.save();

    await logAudit({
      employeeId: req.user?.id,
      action: `PURCHASE_REQUEST_${targetStatus}`,
      entityType: "PURCHASE_REQUEST",
      entityId: d._id,
      description: `Purchase request ${d.requestNumber} transitioned to ${targetStatus}.`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Purchase request status updated to ${targetStatus}.`,
      data: d,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  create,
  list,
  get,
  approve: changeStatus("APPROVED"),
  reject: changeStatus("REJECTED"),
  cancel: changeStatus("CANCELLED"),
};
