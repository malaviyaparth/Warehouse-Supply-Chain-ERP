const PurchaseRequest = require("../Models/PurchaseRequest");
const Product = require("../Models/Product");
const Warehouse = require("../Models/Warehouse");
const { validId } = require("../Utils/crudController");
const create = async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.warehouse || !Array.isArray(b.items) || !b.items.length)
      return res
        .status(400)
        .json({ success: false, message: "warehouse and items are required" });
    if (
      !validId(b.warehouse) ||
      !(await Warehouse.exists({ _id: b.warehouse }))
    )
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    for (const i of b.items) {
      if (!validId(i.product) || !(await Product.exists({ _id: i.product })))
        return res
          .status(404)
          .json({ success: false, message: `Product ${i.product} not found` });
      if (Number(i.quantity) <= 0)
        return res
          .status(400)
          .json({
            success: false,
            message: "Item quantity must be greater than zero",
          });
    }
    const d = await PurchaseRequest.create({
      requestNumber: b.requestNumber || `PR-${Date.now()}`,
      warehouse: b.warehouse,
      requestedBy: req.user?.id,
      items: b.items,
      reason: b.reason || "MANUAL",
      remarks: b.remarks,
    });
    res.status(201).json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const list = async (req, res, next) => {
  try {
    const d = await PurchaseRequest.find(req.query)
      .populate("warehouse", "warehouseName")
      .populate("requestedBy", "name email")
      .populate("items.product", "productName sku")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
const get = async (req, res, next) => {
  try {
    const d = await PurchaseRequest.findById(req.params.id)
      .populate("warehouse requestedBy")
      .populate("items.product");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Purchase request not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const change = (status) => async (req, res, next) => {
  try {
    const d = await PurchaseRequest.findById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Purchase request not found" });
    if (d.status !== "PENDING")
      return res
        .status(400)
        .json({
          success: false,
          message: "Only pending requests can be changed",
        });
    d.status = status;
    await d.save();
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
module.exports = {
  create,
  list,
  get,
  approve: change("APPROVED"),
  reject: change("REJECTED"),
};
