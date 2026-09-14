const StockTransfer = require("../Models/StockTransfer"),
  Inventory = require("../Models/Inventory"),
  StockMovement = require("../Models/StockMovement"),
  Warehouse = require("../Models/Warehouse"),
  Product = require("../Models/Product");
const create = async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.sourceWarehouse || !b.destinationWarehouse || !b.items?.length)
      return res
        .status(400)
        .json({
          success: false,
          message:
            "sourceWarehouse, destinationWarehouse and items are required",
        });
    if (String(b.sourceWarehouse) === String(b.destinationWarehouse))
      return res
        .status(400)
        .json({
          success: false,
          message: "Source and destination warehouses must differ",
        });
    if (
      !(await Warehouse.exists({ _id: b.sourceWarehouse })) ||
      !(await Warehouse.exists({ _id: b.destinationWarehouse }))
    )
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    for (const i of b.items) {
      if (!(await Product.exists({ _id: i.product })))
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      if (i.quantity <= 0)
        return res
          .status(400)
          .json({
            success: false,
            message: "Quantity must be greater than zero",
          });
    }
    const d = await StockTransfer.create({
      sourceWarehouse: b.sourceWarehouse,
      destinationWarehouse: b.destinationWarehouse,
      requestedBy: req.user?.id,
      items: b.items,
    });
    res.status(201).json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const list = async (req, res, next) => {
  try {
    const d = await StockTransfer.find(req.query)
      .populate("sourceWarehouse destinationWarehouse requestedBy approvedBy")
      .populate("items.product", "productName sku")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
const get = async (req, res, next) => {
  try {
    const d = await StockTransfer.findById(req.params.id)
      .populate("sourceWarehouse destinationWarehouse requestedBy approvedBy")
      .populate("items.product");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const approve = async (req, res, next) => {
  try {
    const d = await StockTransfer.findById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found" });
    if (d.status !== "REQUESTED")
      return res
        .status(400)
        .json({
          success: false,
          message: "Only requested transfers can be approved",
        });
    for (const i of d.items) {
      const inv = await Inventory.findOne({
        product: i.product,
        warehouse: d.sourceWarehouse,
      });
      if (!inv || inv.quantity - inv.reservedStock < i.quantity)
        return res
          .status(409)
          .json({ success: false, message: "Insufficient source stock" });
    }
    d.status = "APPROVED";
    d.approvedBy = req.user?.id;
    await d.save();
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const complete = async (req, res, next) => {
  try {
    const d = await StockTransfer.findById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found" });
    if (!["APPROVED", "IN_TRANSIT"].includes(d.status))
      return res
        .status(400)
        .json({
          success: false,
          message: "Transfer is not ready for completion",
        });
    for (const i of d.items) {
      const src = await Inventory.findOne({
        product: i.product,
        warehouse: d.sourceWarehouse,
      });
      if (!src || src.quantity - src.reservedStock < i.quantity)
        return res
          .status(409)
          .json({ success: false, message: "Insufficient source stock" });
      const prev = src.quantity;
      src.quantity -= i.quantity;
      await src.save();
      let dst = await Inventory.findOne({
        product: i.product,
        warehouse: d.destinationWarehouse,
      });
      if (!dst)
        dst = await Inventory.create({
          product: i.product,
          warehouse: d.destinationWarehouse,
        });
      const dp = dst.quantity;
      dst.quantity += i.quantity;
      await dst.save();
      await StockMovement.create({
        product: i.product,
        warehouse: d.sourceWarehouse,
        type: "TRANSFER_OUT",
        quantity: i.quantity,
        referenceType: "TRANSFER",
        referenceId: d._id,
        previousQuantity: prev,
        newQuantity: src.quantity,
        performedBy: req.user?.id,
      });
      await StockMovement.create({
        product: i.product,
        warehouse: d.destinationWarehouse,
        type: "TRANSFER_IN",
        quantity: i.quantity,
        referenceType: "TRANSFER",
        referenceId: d._id,
        previousQuantity: dp,
        newQuantity: dst.quantity,
        performedBy: req.user?.id,
      });
      i.receivedQuantity = i.quantity;
    }
    d.status = "COMPLETED";
    d.completedAt = new Date();
    await d.save();
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
module.exports = { create, list, get, approve, complete };
