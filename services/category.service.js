const mongoose = require("mongoose");
const Category = require("../Models/Category");

const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid category ID");
    error.statusCode = 400;
    throw error;
  }
};

const validateCategoryName = (categoryName) => {
  if (
    !categoryName ||
    typeof categoryName !== "string" ||
    !categoryName.trim()
  ) {
    const error = new Error("Category name is required");
    error.statusCode = 400;
    throw error;
  }
};

const createCategory = async (categoryData = {}) => {
  validateCategoryName(categoryData.categoryName);

  return Category.create({
    categoryName: categoryData.categoryName.trim(),
    description: categoryData.description?.trim() || "",
    status: categoryData.status || "ACTIVE",
  });
};

const getCategories = async () => {
  return Category.find().sort({ createdAt: -1 });
};

const getCategoryById = async (id) => {
  validateId(id);
  return Category.findById(id);
};

const updateCategory = async (id, categoryData = {}) => {
  validateId(id);

  const updates = {};

  if (categoryData.categoryName !== undefined) {
    validateCategoryName(categoryData.categoryName);
    updates.categoryName = categoryData.categoryName.trim();
  }

  if (categoryData.description !== undefined) {
    updates.description = String(categoryData.description).trim();
  }

  if (categoryData.status !== undefined) {
    updates.status = categoryData.status;
  }

  return Category.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

const deleteCategory = async (id) => {
  validateId(id);
  return Category.findByIdAndDelete(id);
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
