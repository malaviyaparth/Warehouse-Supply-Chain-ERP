const mongoose = require("mongoose");
const Product = require("../Models/Product");
const Category = require("../Models/Category");
const Brand = require("../Models/Brand");

const validateId = (id, label = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
};

const validateProduct = (data) => {
  if (!data.category) {
    const error = new Error("Category is required");
    error.statusCode = 400;
    throw error;
  }

  if (!data.productName?.trim()) {
    const error = new Error("Product name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!data.sku?.trim()) {
    const error = new Error("SKU is required");
    error.statusCode = 400;
    throw error;
  }

  if (data.unitPrice === undefined || Number(data.unitPrice) < 0) {
    const error = new Error("Valid unitPrice is required");
    error.statusCode = 400;
    throw error;
  }
};

const validateReferences = async (data) => {
  validateId(data.category, "category ID");

  if (!(await Category.exists({ _id: data.category }))) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.brand) {
    validateId(data.brand, "brand ID");

    if (!(await Brand.exists({ _id: data.brand }))) {
      const error = new Error("Brand not found");
      error.statusCode = 404;
      throw error;
    }
  }
};

const createProduct = async (data = {}) => {
  validateProduct(data);
  await validateReferences(data);

  return Product.create({
    category: data.category,
    brand: data.brand || undefined,
    productName: data.productName.trim(),
    sku: data.sku.trim().toUpperCase(),
    barcode: data.barcode?.trim() || undefined,
    unitPrice: Number(data.unitPrice),
    unit: data.unit || "PCS",
    status: data.status || "ACTIVE",
  });
};

const getProducts = async ({ search, category, brand } = {}) => {
  const query = {};

  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    validateId(category, "category ID");
    query.category = category;
  }

  if (brand) {
    validateId(brand, "brand ID");
    query.brand = brand;
  }

  return Product.find(query)
    .populate("category", "categoryName")
    .populate("brand")
    .sort({ createdAt: -1 });
};

const getProductById = async (id) => {
  validateId(id, "product ID");

  return Product.findById(id)
    .populate("category", "categoryName")
    .populate("brand");
};

const updateProduct = async (id, data = {}) => {
  validateId(id, "product ID");

  const updates = {};

  if (data.category) {
    await validateReferences(data);
    updates.category = data.category;
  }

  if (data.brand !== undefined) {
    if (data.brand) {
      validateId(data.brand, "brand ID");
      if (!(await Brand.exists({ _id: data.brand }))) {
        const error = new Error("Brand not found");
        error.statusCode = 404;
        throw error;
      }
    }
    updates.brand = data.brand || null;
  }

  if (data.productName !== undefined)
    updates.productName = data.productName.trim();
  if (data.sku !== undefined) updates.sku = data.sku.trim().toUpperCase();
  if (data.barcode !== undefined) updates.barcode = data.barcode.trim();
  if (data.unitPrice !== undefined) updates.unitPrice = Number(data.unitPrice);
  if (data.unit !== undefined) updates.unit = data.unit;
  if (data.status !== undefined) updates.status = data.status;

  return Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("category", "categoryName")
    .populate("brand");
};

const deleteProduct = async (id) => {
  validateId(id, "product ID");
  return Product.findByIdAndDelete(id);
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
