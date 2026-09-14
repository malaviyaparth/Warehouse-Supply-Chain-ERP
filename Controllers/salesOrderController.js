const SalesOrder = require("../Models/SalesOrder");
const Customer = require("../Models/Customer");
const Product = require("../Models/Product");
const Warehouse = require("../Models/Warehouse");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const Invoice = require("../Models/Invoice");
const { validId } = require("../Utils/crudController");
const create = async (req, res, next) => {
  try {
    const b = req.body;
    if (
      !b.customer ||
      !b.warehouse ||
      !Array.isArray(b.items) ||
      !b.items.length
    )
      return res
        .status(400)
        .json({
          success: false,
          message: "customer, warehouse and items are required",
        });
    if (!(await Customer.exists({ _id: b.customer })))
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    if (!(await Warehouse.exists({ _id: b.warehouse })))
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    let subtotal = 0;
    const items = [];
    for (const i of b.items) {
      const p = await Product.findById(i.product);
      if (!p)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      const qty = Number(i.quantity),
        price = i.unitPrice === undefined ? p.unitPrice : Number(i.unitPrice);
      if (qty <= 0 || price < 0)
        return res
          .status(400)
          .json({ success: false, message: "Invalid item" });
      const total = qty * price;
      subtotal += total;
      items.push({
        product: p._id,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
      });
    }
    const tax = Number(b.taxAmount || 0),
      discount = Number(b.discountAmount || 0);
    const d = await SalesOrder.create({
      salesOrderNumber: b.salesOrderNumber || `SO-${Date.now()}`,
      customer: b.customer,
      warehouse: b.warehouse,
      createdBy: req.user?.id,
      items,
      subtotal,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount: Math.max(0, subtotal + tax - discount),
      remarks: b.remarks,
    });
    res
      .status(201)
      .json({
        success: true,
        data: await SalesOrder.findById(d._id).populate(
          "customer warehouse items.product",
        ),
      });
  } catch (e) {
    next(e);
  }
};
const list = async (req, res, next) => {
  try {
    const d = await SalesOrder.find(req.query)
      .populate("customer", "customerName phone email")
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
    const d = await SalesOrder.findById(req.params.id).populate(
      "customer warehouse items.product",
    );
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Sales order not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const reserve = async (req, res, next) => {
  try {
    const d = await SalesOrder.findById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Sales order not found" });
    if (d.status !== "PENDING")
      return res
        .status(400)
        .json({
          success: false,
          message: "Only pending orders can be confirmed",
        });
    for (const i of d.items) {
      const inv = await Inventory.findOne({
        product: i.product,
        warehouse: d.warehouse,
      });
      if (!inv || inv.quantity - inv.reservedStock < i.quantity)
        return res
          .status(409)
          .json({
            success: false,
            message: `Insufficient stock for product ${i.product}`,
          });
    }
    for (const i of d.items) {
      const inv = await Inventory.findOne({
        product: i.product,
        warehouse: d.warehouse,
      });
      inv.reservedStock += i.quantity;
      await inv.save();
    }
    d.status = "CONFIRMED";
    await d.save();
    res.json({
      success: true,
      message: "Stock reserved and order confirmed",
      data: d,
    });
  } catch (e) {
    next(e);
  }
};
const fulfill = async (req, res, next) => {
  try {
    const d = await SalesOrder.findById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Sales order not found" });
    if (!["CONFIRMED", "PROCESSING"].includes(d.status))
      return res
        .status(400)
        .json({
          success: false,
          message: "Order must be confirmed before fulfillment",
        });
    for (const i of d.items) {
      const inv = await Inventory.findOne({
        product: i.product,
        warehouse: d.warehouse,
      });
      if (!inv || inv.reservedStock < i.quantity || inv.quantity < i.quantity)
        return res
          .status(409)
          .json({ success: false, message: "Insufficient reserved stock" });
      const prev = inv.quantity;
      inv.quantity -= i.quantity;
      inv.reservedStock -= i.quantity;
      await inv.save();
      await StockMovement.create({
        product: i.product,
        warehouse: d.warehouse,
        type: "STOCK_OUT",
        quantity: i.quantity,
        referenceType: "SALE",
        referenceId: d._id,
        previousQuantity: prev,
        newQuantity: inv.quantity,
        performedBy: req.user?.id,
      });
    }
    d.status = "SHIPPED";
    await d.save();
    res.json({
      success: true,
      message: "Order fulfilled and stock deducted",
      data: d,
    });
  } catch (e) {
    next(e);
  }
};
const cancel = async (req, res, next) => {
  try {
    const d = await SalesOrder.findById(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Sales order not found" });
    if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(d.status))
      return res
        .status(400)
        .json({ success: false, message: "Order cannot be cancelled" });
    if (d.status === "CONFIRMED") {
      for (const i of d.items) {
        const inv = await Inventory.findOne({
          product: i.product,
          warehouse: d.warehouse,
        });
        if (inv) {
          inv.reservedStock = Math.max(0, inv.reservedStock - i.quantity);
          await inv.save();
        }
      }
    }
    d.status = "CANCELLED";
    await d.save();
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const invoice = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Sales order not found" });
    const existing = await Invoice.findOne({ salesOrder: order._id });
    if (existing) return res.json({ success: true, data: existing });
    const d = await Invoice.create({
      salesOrder: order._id,
      invoiceNumber: `INV-${Date.now()}`,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
    });
    res.status(201).json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
module.exports = { create, list, get, reserve, fulfill, cancel, invoice };
