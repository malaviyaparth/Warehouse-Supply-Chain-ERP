const mongoose = require("mongoose");
const Warehouse = require("../Models/Warehouse");

const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid warehouse ID");
    error.statusCode = 400;
    throw error;
  }
};

const validateData = (data) => {
  if (!data.warehouseName?.trim()) {
    const error = new Error("Warehouse name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!data.location?.trim()) {
    const error = new Error("Location is required");
    error.statusCode = 400;
    throw error;
  }

  if (data.capacity === undefined || Number(data.capacity) < 0) {
    const error = new Error("Valid capacity is required");
    error.statusCode = 400;
    throw error;
  }
};

const createWarehouse = async (data = {}) => {
  validateData(data);

  return Warehouse.create({
    warehouseName: data.warehouseName.trim(),
    location: data.location.trim(),
    capacity: Number(data.capacity),
    status: data.status || "ACTIVE",
  });
};

const getWarehouses = async () => {
  return Warehouse.find().sort({ createdAt: -1 });
};

const getWarehouseById = async (id) => {
  validateId(id);
  return Warehouse.findById(id);
};

const updateWarehouse = async (id, data = {}) => {
  validateId(id);

  const updates = {};

  if (data.warehouseName !== undefined) {
    if (!data.warehouseName.trim()) {
      const error = new Error("Warehouse name is required");
      error.statusCode = 400;
      throw error;
    }
    updates.warehouseName = data.warehouseName.trim();
  }

  if (data.location !== undefined) {
    updates.location = data.location.trim();
  }

  if (data.capacity !== undefined) {
    if (Number(data.capacity) < 0) {
      const error = new Error("Capacity cannot be negative");
      error.statusCode = 400;
      throw error;
    }
    updates.capacity = Number(data.capacity);
  }

  if (data.status !== undefined) {
    updates.status = data.status;
  }

  return Warehouse.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

const deleteWarehouse = async (id) => {
  validateId(id);
  return Warehouse.findByIdAndDelete(id);
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};
