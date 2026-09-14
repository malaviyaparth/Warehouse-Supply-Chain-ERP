const Product = require("../Models/Product"),
  Inventory = require("../Models/Inventory"),
  PurchaseRequest = require("../Models/PurchaseRequest");
const calculateROP = async (productId, warehouseId) => {
  const p = await Product.findById(productId);
  if (!p)
    throw Object.assign(new Error("Product not found"), { statusCode: 404 });
  const i = await Inventory.findOne({
    product: productId,
    warehouse: warehouseId,
  });
  const quantity = i?.quantity || 0,
    reservedStock = i?.reservedStock || 0,
    availableStock = quantity - reservedStock,
    reorderPoint = p.averageDailyDemand * p.leadTimeDays + p.safetyStock;
  return {
    productId,
    warehouseId,
    currentStock: quantity,
    reservedStock,
    availableStock,
    averageDailyDemand: p.averageDailyDemand,
    leadTimeDays: p.leadTimeDays,
    safetyStock: p.safetyStock,
    reorderPoint,
    needsReorder: availableStock <= reorderPoint,
  };
};
const createReorderRequest = async (productId, warehouseId, requestedBy) => {
  const r = await calculateROP(productId, warehouseId);
  if (!r.needsReorder)
    return { created: false, message: "Stock is above reorder point", data: r };
  const existing = await PurchaseRequest.findOne({
    warehouse: warehouseId,
    status: "PENDING",
    reason: "LOW_STOCK",
    "items.product": productId,
  });
  if (existing)
    return {
      created: false,
      message: "Pending purchase request already exists",
      data: existing,
    };
  const qty = Math.max(
    1,
    Math.ceil(
      r.reorderPoint + r.averageDailyDemand * r.leadTimeDays - r.availableStock,
    ),
  );
  const d = await PurchaseRequest.create({
    requestNumber: `PR-${Date.now()}`,
    warehouse: warehouseId,
    requestedBy,
    items: [{ product: productId, quantity: qty }],
    reason: "LOW_STOCK",
  });
  return {
    created: true,
    message: "Purchase request created successfully",
    data: d,
  };
};
module.exports = { calculateROP, createReorderRequest };
