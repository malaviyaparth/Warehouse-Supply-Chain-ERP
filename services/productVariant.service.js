const mongoose = require("mongoose");
const Product = require("../Models/Product");
const ProductVariant = require("../Models/ProductVariant");

const validateId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
};

const createVariant = async (data = {}) => {
  validateId(data.product, "product ID");

  if (!(await Product.exists({ _id: data.product }))) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (!data.variantName?.trim() || !data.variantValue?.trim()) {
    const error = new Error("Variant name and value are required");
    error.statusCode = 400;
    throw error;
  }

  return ProductVariant.create({
    product: data.product,
    variantName: data.variantName.trim(),
    variantValue: data.variantValue.trim(),
    sku: data.sku?.trim().toUpperCase() || undefined,
    additionalPrice: Number(data.additionalPrice || 0),
    status: data.status || "ACTIVE",
  });
};

const getVariants = async (productId) => {
  validateId(productId, "product ID");
  return ProductVariant.find({ product: productId })
    .populate("product", "productName sku")
    .sort({ createdAt: -1 });
};

const getVariantById = async (id) => {
  validateId(id, "variant ID");
  return ProductVariant.findById(id).populate("product", "productName sku");
};

const updateVariant = async (id, data = {}) => {
  validateId(id, "variant ID");

  const updates = {};
  if (data.variantName !== undefined)
    updates.variantName = data.variantName.trim();
  if (data.variantValue !== undefined)
    updates.variantValue = data.variantValue.trim();
  if (data.sku !== undefined) updates.sku = data.sku.trim().toUpperCase();
  if (data.additionalPrice !== undefined) {
    updates.additionalPrice = Number(data.additionalPrice);
  }
  if (data.status !== undefined) updates.status = data.status;

  return ProductVariant.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("product", "productName sku");
};

const deleteVariant = async (id) => {
  validateId(id, "variant ID");
  return ProductVariant.findByIdAndDelete(id);
};

module.exports = {
  createVariant,
  getVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
};
