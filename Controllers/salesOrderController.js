const SalesOrder = require("../Models/SalesOrder");
const Customer = require("../Models/Customer");
const Product = require("../Models/Product");
const Warehouse = require("../Models/Warehouse");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const Invoice = require("../Models/Invoice");
const { validId } = require("../Utils/crudController");
const { logAudit } = require("../Utils/auditLogger");
const { runInTransaction } = require("../Utils/dbTransactions");

const create = async (req, res, next) => {
  try {
    const b = req.body;
    const customerId = b.customer || b.customerId;
    const warehouseId = b.warehouse || b.warehouseId;

    if (
      !customerId ||
      !warehouseId ||
      !Array.isArray(b.items) ||
      !b.items.length
    ) {
      return res.status(400).json({
        success: false,
        message: "customer (or customerId), warehouse (or warehouseId) and items are required",
      });
    }

    const customerDoc = await Customer.findById(customerId);
    if (!customerDoc) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    if (customerDoc.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Selected customer is INACTIVE. Inactive customers cannot be selected for new sales orders.",
      });
    }

    const whDoc = await Warehouse.findById(warehouseId);
    if (!whDoc) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    if (whDoc.status === "INACTIVE") {
      return res.status(400).json({ success: false, message: "Selected warehouse is INACTIVE." });
    }

    let subtotal = 0;
    const items = [];
    for (const i of b.items) {
      const prodId = i.product || i.productId;
      const p = await Product.findById(prodId);
      if (!p) {
        return res.status(404).json({ success: false, message: `Product ${prodId} not found` });
      }
      const qty = Number(i.quantity);
      const price = i.unitPrice === undefined ? p.unitPrice : Number(i.unitPrice);
      if (qty <= 0 || price < 0) {
        return res.status(400).json({ success: false, message: "Quantity must be > 0 and price >= 0" });
      }
      const total = qty * price;
      subtotal += total;
      items.push({
        product: p._id,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
      });
    }

    const tax = Number(b.taxAmount || 0);
    const discount = Number(b.discountAmount || 0);
    const initialStatus = b.status && ["DRAFT", "PENDING"].includes(b.status.toUpperCase())
      ? b.status.toUpperCase()
      : "PENDING";

    const d = await SalesOrder.create({
      salesOrderNumber: b.salesOrderNumber || `SO-${Date.now()}`,
      customer: customerDoc._id,
      warehouse: whDoc._id,
      createdBy: req.user?.id,
      items,
      subtotal,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount: Math.max(0, subtotal + tax - discount),
      status: initialStatus,
      remarks: b.remarks,
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "SALES_ORDER_CREATED",
      entityType: "SALES_ORDER",
      entityId: d._id,
      description: `Sales Order ${d.salesOrderNumber} created for customer ${customerDoc.customerName}`,
      newData: d.toObject(),
      ipAddress: req.ip,
    });

    const populated = await SalesOrder.findById(d._id)
      .populate("customer", "customerName phone email")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName sku");

    res.status(201).json({ success: true, data: populated });
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

    const orderIds = d.map((o) => o._id);
    const invoices = await Invoice.find({ salesOrder: { $in: orderIds } }).select(
      "_id salesOrder invoiceNumber status paymentStatus totalAmount"
    );
    const invoiceMap = new Map();
    invoices.forEach((inv) => invoiceMap.set(String(inv.salesOrder), inv));

    const enriched = d.map((order) => {
      const orderObj = order.toObject();
      orderObj.invoice = invoiceMap.get(String(order._id)) || null;
      return orderObj;
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    const d = await SalesOrder.findById(req.params.id)
      .populate("customer", "customerName phone email address")
      .populate("warehouse", "warehouseName location")
      .populate("items.product");
    if (!d) return res.status(404).json({ success: false, message: "Sales order not found" });

    const inv = await Invoice.findOne({ salesOrder: d._id });
    const orderObj = d.toObject();
    orderObj.invoice = inv || null;

    res.json({ success: true, data: orderObj });
  } catch (e) {
    next(e);
  }
};

const reserve = async (req, res, next) => {
  try {
    const d = await SalesOrder.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Sales order not found" });

    if (d.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot reserve stock for a cancelled sales order",
      });
    }

    if (d.status === "RESERVED" || d.status === "FULFILLED" || d.status === "SHIPPED") {
      return res.status(400).json({
        success: false,
        message: `Order is already ${d.status}. Duplicate reservation not allowed.`,
      });
    }

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};

      for (const i of d.items) {
        let invQuery = Inventory.findOne({
          product: i.product,
          warehouse: d.warehouse,
        });
        if (session) invQuery = invQuery.session(session);
        const inv = await invQuery;

        const available = inv ? inv.quantity - (inv.reservedStock || 0) : 0;
        if (!inv || available < i.quantity) {
          const err = new Error(
            `Insufficient available stock for product ${i.product} in warehouse ${d.warehouse}. Available: ${available}, Requested: ${i.quantity}`
          );
          err.statusCode = 409;
          throw err;
        }

        inv.reservedStock = (inv.reservedStock || 0) + i.quantity;
        await inv.save(opts);
      }

      d.status = "RESERVED";
      await d.save(opts);

      await logAudit({
        employeeId: req.user?.id,
        action: "STOCK_RESERVED",
        entityType: "SALES_ORDER",
        entityId: d._id,
        description: `Stock reserved for Sales Order ${d.salesOrderNumber}`,
        newData: d.toObject(),
        ipAddress: req.ip,
      });
    });

    const populated = await SalesOrder.findById(d._id)
      .populate("customer", "customerName")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName sku");

    res.json({
      success: true,
      message: "Stock reserved successfully",
      data: populated,
    });
  } catch (e) {
    if (e.statusCode) {
      return res.status(e.statusCode).json({ success: false, message: e.message });
    }
    next(e);
  }
};

const fulfill = async (req, res, next) => {
  try {
    const d = await SalesOrder.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Sales order not found" });

    if (["FULFILLED", "SHIPPED", "DELIVERED"].includes(d.status)) {
      return res.status(400).json({
        success: false,
        message: "Order has already been fulfilled.",
      });
    }

    if (d.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot fulfill a cancelled order",
      });
    }

    if (!["RESERVED", "CONFIRMED", "PROCESSING"].includes(d.status)) {
      return res.status(400).json({
        success: false,
        message: "Order must have reserved stock before fulfillment",
      });
    }

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};

      for (const i of d.items) {
        let invQuery = Inventory.findOne({
          product: i.product,
          warehouse: d.warehouse,
        });
        if (session) invQuery = invQuery.session(session);
        const inv = await invQuery;

        if (!inv || (inv.reservedStock || 0) < i.quantity || inv.quantity < i.quantity) {
          const err = new Error(
            `Insufficient inventory/reserved stock for product ${i.product}. Required: ${i.quantity}, Physical: ${inv?.quantity || 0}, Reserved: ${inv?.reservedStock || 0}`
          );
          err.statusCode = 409;
          throw err;
        }

        const prevQty = inv.quantity;
        inv.quantity -= i.quantity;
        inv.reservedStock -= i.quantity;
        await inv.save(opts);

        const movementData = {
          product: i.product,
          warehouse: d.warehouse,
          type: "STOCK_OUT",
          quantity: i.quantity,
          referenceType: "SALE",
          referenceId: d._id,
          previousQuantity: prevQty,
          newQuantity: inv.quantity,
          performedBy: req.user?.id,
        };

        if (session) {
          await StockMovement.create([movementData], { session });
        } else {
          await StockMovement.create(movementData);
        }
      }

      d.status = "FULFILLED";
      await d.save(opts);

      await logAudit({
        employeeId: req.user?.id,
        action: "SALES_ORDER_FULFILLED",
        entityType: "SALES_ORDER",
        entityId: d._id,
        description: `Sales Order ${d.salesOrderNumber} fulfilled and stock deducted`,
        newData: d.toObject(),
        ipAddress: req.ip,
      });
    });

    const populated = await SalesOrder.findById(d._id)
      .populate("customer", "customerName")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName sku");

    res.json({
      success: true,
      message: "Order fulfilled and physical stock decreased atomically",
      data: populated,
    });
  } catch (e) {
    if (e.statusCode) {
      return res.status(e.statusCode).json({ success: false, message: e.message });
    }
    next(e);
  }
};

const cancel = async (req, res, next) => {
  try {
    const d = await SalesOrder.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Sales order not found" });

    if (["FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(d.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in status ${d.status}`,
      });
    }

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};

      if (["RESERVED", "CONFIRMED", "PROCESSING"].includes(d.status)) {
        for (const i of d.items) {
          let invQuery = Inventory.findOne({
            product: i.product,
            warehouse: d.warehouse,
          });
          if (session) invQuery = invQuery.session(session);
          const inv = await invQuery;

          if (inv && (inv.reservedStock || 0) > 0) {
            inv.reservedStock = Math.max(0, inv.reservedStock - i.quantity);
            await inv.save(opts);
          }
        }
      }

      d.status = "CANCELLED";
      await d.save(opts);

      await logAudit({
        employeeId: req.user?.id,
        action: "SALES_ORDER_CANCELLED",
        entityType: "SALES_ORDER",
        entityId: d._id,
        description: `Sales Order ${d.salesOrderNumber} cancelled, reservations released`,
        newData: d.toObject(),
        ipAddress: req.ip,
      });
    });

    res.json({ success: true, message: "Order cancelled successfully", data: d });
  } catch (e) {
    if (e.statusCode) {
      return res.status(e.statusCode).json({ success: false, message: e.message });
    }
    next(e);
  }
};

const invoice = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id).populate("items.product customer");
    if (!order) return res.status(404).json({ success: false, message: "Sales order not found" });

    const existing = await Invoice.findOne({ salesOrder: order._id });
    if (existing) {
      return res.json({
        success: true,
        alreadyExisted: true,
        message: `Invoice ${existing.invoiceNumber} already exists for this sales order.`,
        data: existing,
      });
    }

    const invoiceItems = order.items.map((i) => ({
      product: i.product?._id || i.product,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice !== undefined ? i.totalPrice : i.quantity * i.unitPrice,
    }));

    const d = await Invoice.create({
      salesOrder: order._id,
      customer: order.customer?._id || order.customer,
      items: invoiceItems,
      invoiceNumber: `INV-${Date.now()}`,
      subtotal: order.subtotal || 0,
      taxAmount: order.taxAmount || 0,
      discountAmount: order.discountAmount || 0,
      totalAmount: order.totalAmount || 0,
      status: "ISSUED",
      paymentStatus: "UNPAID",
      createdBy: req.user?.id,
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "INVOICE_GENERATED",
      entityType: "INVOICE",
      entityId: d._id,
      description: `Invoice ${d.invoiceNumber} created for Sales Order ${order.salesOrderNumber}`,
      newData: d.toObject(),
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      alreadyExisted: false,
      message: `Invoice ${d.invoiceNumber} generated successfully!`,
      data: d,
    });
  } catch (e) {
    next(e);
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    let items = [];
    let warehouseId = req.query.warehouse;

    if (id) {
      const order = await SalesOrder.findById(id).populate("items.product", "productName sku");
      if (!order) return res.status(404).json({ success: false, message: "Sales order not found" });
      warehouseId = warehouseId || order.warehouse;
      items = order.items.map((i) => ({
        product: i.product?._id || i.product,
        productName: i.product?.productName || "Product",
        sku: i.product?.sku || "",
        quantity: i.quantity,
      }));
    }

    const warehouse = await Warehouse.findById(warehouseId);
    const results = [];
    let allAvailable = true;

    for (const item of items) {
      const inv = await Inventory.findOne({ product: item.product, warehouse: warehouseId });
      const inStock = inv?.quantity || 0;
      const reserved = inv?.reservedStock || 0;
      const available = Math.max(0, inStock - reserved);
      const sufficient = available >= item.quantity;
      if (!sufficient) allAvailable = false;

      results.push({
        product: item.product,
        productName: item.productName,
        sku: item.sku,
        requestedQuantity: item.quantity,
        inStock,
        reservedStock: reserved,
        availableStock: available,
        sufficient,
      });
    }

    res.json({
      success: true,
      warehouse: warehouse ? warehouse.warehouseName : warehouseId,
      allAvailable,
      items: results,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  create,
  list,
  get,
  reserve,
  fulfill,
  cancel,
  invoice,
  checkAvailability,
};

