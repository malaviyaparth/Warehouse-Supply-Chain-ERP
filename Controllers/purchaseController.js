const PurchaseOrder = require("../Models/PurchaseOrder");
const PurchaseRequest = require("../Models/PurchaseRequest");
const Vendor = require("../Models/Vendor");
const Warehouse = require("../Models/Warehouse");
const Product = require("../Models/Product");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const { validId } = require("../Utils/crudController");
const create = async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.vendor || !b.warehouse || !Array.isArray(b.items) || !b.items.length)
      return res
        .status(400)
        .json({
          success: false,
          message: "vendor, warehouse and items are required",
        });
    if (!validId(b.vendor) || !validId(b.warehouse))
      return res
        .status(400)
        .json({ success: false, message: "Invalid vendor or warehouse ID" });
    if (!(await Vendor.exists({ _id: b.vendor })))
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    if (!(await Warehouse.exists({ _id: b.warehouse })))
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    const items = [];
    let total = 0;
    for (const i of b.items) {
      const p = await Product.findById(i.product);
      if (!p)
        return res
          .status(404)
          .json({ success: false, message: `Product ${i.product} not found` });
      const qty = Number(i.quantity),
        price = i.unitPrice === undefined ? p.unitPrice : Number(i.unitPrice);
      if (qty <= 0 || price < 0)
        return res
          .status(400)
          .json({ success: false, message: "Invalid item quantity or price" });
      items.push({ product: p._id, quantity: qty, unitPrice: price });
      total += qty * price;
    }
    const po = await PurchaseOrder.create({
      purchaseOrderNumber: b.purchaseOrderNumber || `PO-${Date.now()}`,
      purchaseRequest: b.purchaseRequest,
      vendor: b.vendor,
      warehouse: b.warehouse,
      createdBy: req.user?.id,
      expectedDate: b.expectedDate,
      items,
      totalAmount: total,
      remarks: b.remarks,
      status: b.status || "PENDING",
    });
    if (b.purchaseRequest && validId(b.purchaseRequest))
      await PurchaseRequest.findByIdAndUpdate(b.purchaseRequest, {
        status: "CONVERTED",
      });
    res
      .status(201)
      .json({
        success: true,
        data: await PurchaseOrder.findById(po._id).populate(
          "vendor warehouse items.product",
        ),
      });
  } catch (e) {
    next(e);
  }
};
const list = async (req, res, next) => {
  try {
    const d = await PurchaseOrder.find(req.query)
      .populate("vendor", "vendorName")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName sku")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
const get = async (req, res, next) => {
  try {
    const d = await PurchaseOrder.findById(req.params.id).populate(
      "vendor warehouse items.product purchaseRequest",
    );
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const receive = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po)
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    if (["CANCELLED", "RECEIVED"].includes(po.status))
      return res
        .status(400)
        .json({ success: false, message: "Purchase order cannot be received" });
    for (const item of po.items) {
      const received = Number(
        (req.body.items || []).find(
          (x) => String(x.product) === String(item.product),
        )?.receivedQuantity ?? item.quantity - item.receivedQuantity,
      );
      if (received < 0 || received > item.quantity - item.receivedQuantity)
        return res
          .status(400)
          .json({
            success: false,
            message: "Received quantity exceeds remaining quantity",
          });
      if (received > 0) {
        let inv = await Inventory.findOne({
          product: item.product,
          warehouse: po.warehouse,
        });
        if (!inv)
          inv = await Inventory.create({
            product: item.product,
            warehouse: po.warehouse,
          });
        const prev = inv.quantity;
        inv.quantity += received;
        await inv.save();
        item.receivedQuantity += received;
        await StockMovement.create({
          product: item.product,
          warehouse: po.warehouse,
          type: "STOCK_IN",
          quantity: received,
          referenceType: "PURCHASE",
          referenceId: po._id,
          previousQuantity: prev,
          newQuantity: inv.quantity,
          performedBy: req.user?.id,
        });
      }
    }
    po.status = po.items.every((i) => i.receivedQuantity >= i.quantity)
      ? "RECEIVED"
      : "PARTIALLY_RECEIVED";
    await po.save();
    res.json({ success: true, message: "Goods received", data: po });
  } catch (e) {
    next(e);
  }
};
const cancel = async (req, res, next) => {
  try {
    const d = await PurchaseOrder.findById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    if (["RECEIVED", "CANCELLED"].includes(d.status))
      return res
        .status(400)
        .json({ success: false, message: "Order cannot be cancelled" });
    d.status = "CANCELLED";
    await d.save();
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const approve = async (req, res, next) => {
  try {
    const d = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { status: "APPROVED" },
      { new: true, runValidators: true },
    );
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
module.exports = { create, list, get, receive, cancel, approve };
