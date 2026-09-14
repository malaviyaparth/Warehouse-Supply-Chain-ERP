const Product = require("../Models/Product");
const Category = require("../Models/Category");
const Brand = require("../Models/Brand");
const { validId } = require("../Utils/crudController");

const create = async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.productName || !b.sku || b.unitPrice === undefined || !b.category)
      return res
        .status(400)
        .json({
          success: false,
          message: "productName, sku, category and unitPrice are required",
        });
    if (!validId(b.category))
      return res
        .status(400)
        .json({ success: false, message: "Invalid category ID" });
    if (!(await Category.exists({ _id: b.category })))
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    if (b.brand) {
      if (!validId(b.brand))
        return res
          .status(400)
          .json({ success: false, message: "Invalid brand ID" });
      if (!(await Brand.exists({ _id: b.brand })))
        return res
          .status(404)
          .json({ success: false, message: "Brand not found" });
    }
    const doc = await Product.create({
      ...b,
      sku: b.sku.trim().toUpperCase(),
      productName: b.productName.trim(),
      unitPrice: Number(b.unitPrice),
    });
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};
const list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.search) {
      const s = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      q.$or = [
        { productName: { $regex: s, $options: "i" } },
        { sku: { $regex: s, $options: "i" } },
        { barcode: { $regex: s, $options: "i" } },
      ];
    }
    if (req.query.category) q.category = req.query.category;
    if (req.query.brand) q.brand = req.query.brand;
    if (req.query.status) q.status = req.query.status;
    const docs = await Product.find(q)
      .populate("category", "categoryName")
      .populate("brand", "brandName")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (e) {
    next(e);
  }
};
const get = async (req, res, next) => {
  try {
    if (!validId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    const d = await Product.findById(req.params.id)
      .populate("category", "categoryName")
      .populate("brand", "brandName");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const update = async (req, res, next) => {
  try {
    if (!validId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    const b = { ...req.body };
    if (b.sku) b.sku = b.sku.trim().toUpperCase();
    if (b.unitPrice !== undefined) b.unitPrice = Number(b.unitPrice);
    const d = await Product.findByIdAndUpdate(req.params.id, b, {
      new: true,
      runValidators: true,
    })
      .populate("category", "categoryName")
      .populate("brand", "brandName");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const remove = async (req, res, next) => {
  try {
    const d = await Product.findByIdAndDelete(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (e) {
    next(e);
  }
};
module.exports = { create, list, get, update, remove };
