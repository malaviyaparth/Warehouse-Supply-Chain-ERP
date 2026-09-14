const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const Product = require("../Models/Product");
const Warehouse = require("../Models/Warehouse");
const { validId } = require("../Utils/crudController");
const list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.product) q.product = req.query.product;
    if (req.query.warehouse) q.warehouse = req.query.warehouse;
    const d = await Inventory.find(q)
      .populate("product", "productName sku unitPrice")
      .populate("warehouse", "warehouseName location")
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
const get = async (req, res, next) => {
  try {
    const d = await Inventory.findById(req.params.id)
      .populate("product")
      .populate("warehouse");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Inventory record not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const upsert = async (req, res, next) => {
  try {
    const {
      product,
      warehouse,
      quantity = 0,
      reservedStock = 0,
      damagedStock = 0,
      reorderLevel = 0,
    } = req.body;
    if (!validId(product) || !validId(warehouse))
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid product and warehouse are required",
        });
    if (!(await Product.exists({ _id: product })))
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (!(await Warehouse.exists({ _id: warehouse })))
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    const d = await Inventory.findOneAndUpdate(
      { product, warehouse },
      { $set: { quantity, reservedStock, damagedStock, reorderLevel } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );
    res.status(200).json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const adjust = async (req, res, next) => {
  try {
    const { quantity, type = "ADJUSTMENT", reason } = req.body;
    if (quantity === undefined || Number(quantity) < 0)
      return res
        .status(400)
        .json({ success: false, message: "quantity must be >= 0" });
    const d = await Inventory.findById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Inventory record not found" });
    const prev = d.quantity;
    d.quantity = Number(quantity);
    await d.save();
    await StockMovement.create({
      product: d.product,
      warehouse: d.warehouse,
      type,
      quantity: Math.abs(d.quantity - prev),
      referenceType: "ADJUSTMENT",
      previousQuantity: prev,
      newQuantity: d.quantity,
      performedBy: req.user?.id,
    });
    res.json({ success: true, data: d, previousQuantity: prev });
  } catch (e) {
    next(e);
  }
};
module.exports = { list, get, upsert, adjust };
