const Return = require("../Models/Return");
const SalesOrder = require("../Models/SalesOrder");
const Customer = require("../Models/Customer");
const Warehouse = require("../Models/Warehouse");
const Product = require("../Models/Product");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const { logAudit } = require("../Utils/auditLogger");
const { runInTransaction } = require("../Utils/dbTransactions");

// 1. Create Return Request
const create = async (req, res, next) => {
  try {
    const { salesOrder, customer, warehouse, items, reason, refundAmount, remarks } = req.body;

    if (!salesOrder || !items || !items.length || !reason) {
      return res.status(400).json({
        success: false,
        message: "salesOrder, items and reason are required.",
      });
    }

    const order = await SalesOrder.findById(salesOrder);
    if (!order) {
      return res.status(404).json({ success: false, message: "Sales order not found." });
    }

    if (order.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot create a return for a cancelled sales order.",
      });
    }

    if (!["FULFILLED", "SHIPPED", "DELIVERED"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot return items for an order that has not been fulfilled or delivered.",
      });
    }

    // Find all existing non-rejected returns for this sales order to prevent over-returning
    const existingReturns = await Return.find({
      salesOrder: order._id,
      status: { $ne: "REJECTED" },
    });

    const alreadyReturnedMap = {};
    for (const er of existingReturns) {
      for (const item of er.items) {
        const pid = String(item.product);
        alreadyReturnedMap[pid] = (alreadyReturnedMap[pid] || 0) + item.quantity;
      }
    }

    // Validate returned items against order items
    const formattedItems = [];
    for (const item of items) {
      const prodId = item.product || item.productId;
      const orderItem = order.items.find((oi) => String(oi.product) === String(prodId));

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${prodId} was not part of the original sales order.`,
        });
      }

      const returnQty = Number(item.quantity);
      if (returnQty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Returned quantity must be greater than zero.",
        });
      }

      const previouslyReturned = alreadyReturnedMap[String(prodId)] || 0;
      const maxReturnable = orderItem.quantity - previouslyReturned;

      if (returnQty > maxReturnable) {
        return res.status(400).json({
          success: false,
          message: `Cannot return ${returnQty} of product ${prodId}. Sold: ${orderItem.quantity}, Already returned/requested: ${previouslyReturned}, Maximum remaining returnable: ${maxReturnable}.`,
        });
      }

      const rawCondition = (item.condition || "GOOD").toUpperCase();
      const validCondition = ["GOOD", "RESTOCKABLE", "DAMAGED"].includes(rawCondition)
        ? rawCondition
        : "GOOD";

      formattedItems.push({
        product: prodId,
        quantity: returnQty,
        condition: validCondition,
        reason: item.reason || reason,
      });
    }

    const targetCustomer = customer || order.customer;
    const targetWarehouse = warehouse || order.warehouse;
    const returnNumber = `RET-${Date.now()}`;

    const ret = await Return.create({
      returnNumber,
      salesOrder: order._id,
      customer: targetCustomer,
      warehouse: targetWarehouse,
      items: formattedItems,
      reason,
      refundAmount: Number(refundAmount) || 0,
      remarks: remarks || "",
      status: "REQUESTED",
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "RETURN_REQUESTED",
      entityType: "RETURN",
      entityId: ret._id,
      description: `Return ${returnNumber} requested for Sales Order ${order.salesOrderNumber}`,
      newData: ret.toObject(),
      ipAddress: req.ip,
    });

    const populated = await Return.findById(ret._id)
      .populate("salesOrder", "salesOrderNumber status totalAmount")
      .populate("customer", "customerName email phone")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName sku");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// 2. List Returns
const list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status.toUpperCase();
    if (req.query.salesOrder) filter.salesOrder = req.query.salesOrder;
    if (req.query.warehouse) filter.warehouse = req.query.warehouse;
    if (req.query.customer) filter.customer = req.query.customer;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [total, returns] = await Promise.all([
      Return.countDocuments(filter),
      Return.find(filter)
        .populate("salesOrder", "salesOrderNumber status totalAmount orderDate")
        .populate("customer", "customerName email phone")
        .populate("warehouse", "warehouseName location")
        .populate("receivedBy", "name email")
        .populate("inspectedBy", "name email")
        .populate("items.product", "productName sku")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      count: returns.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      data: returns,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Return
const get = async (req, res, next) => {
  try {
    const ret = await Return.findById(req.params.id)
      .populate("salesOrder")
      .populate("customer")
      .populate("warehouse")
      .populate("receivedBy", "name email")
      .populate("inspectedBy", "name email")
      .populate("items.product");

    if (!ret) {
      return res.status(404).json({ success: false, message: "Return record not found." });
    }

    res.json({ success: true, data: ret });
  } catch (error) {
    next(error);
  }
};

// 4. Update Status (Approve / Reject / Receive)
const updateStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const ret = await Return.findById(req.params.id);

    if (!ret) {
      return res.status(404).json({ success: false, message: "Return not found." });
    }

    const valid = ["REQUESTED", "APPROVED", "RECEIVED", "INSPECTED", "REJECTED", "CANCELLED"];
    const targetStatus = status.toUpperCase();
    if (!valid.includes(targetStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status transition." });
    }

    ret.status = targetStatus;
    if (remarks) ret.remarks = remarks;
    if (targetStatus === "RECEIVED") {
      ret.receivedBy = req.user?.id;
    }

    await ret.save();

    await logAudit({
      employeeId: req.user?.id,
      action: `RETURN_${targetStatus}`,
      entityType: "RETURN",
      entityId: ret._id,
      description: `Return ${ret.returnNumber} updated to ${targetStatus}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: ret });
  } catch (error) {
    next(error);
  }
};

// 5. Inspect Return Items (GOOD vs DAMAGED recorded by Warehouse Manager)
const inspect = async (req, res, next) => {
  try {
    const { items, remarks } = req.body;
    const ret = await Return.findById(req.params.id);

    if (!ret) {
      return res.status(404).json({ success: false, message: "Return not found." });
    }

    if (!["APPROVED", "RECEIVED", "INSPECTED"].includes(ret.status)) {
      return res.status(400).json({
        success: false,
        message: "Return must be APPROVED or RECEIVED before inspection.",
      });
    }

    if (Array.isArray(items) && items.length > 0) {
      for (const updateItem of items) {
        const existingItem = ret.items.find(
          (i) => String(i.product) === String(updateItem.product || updateItem.productId)
        );
        if (existingItem && updateItem.condition) {
          const cond = updateItem.condition.toUpperCase();
          if (["GOOD", "RESTOCKABLE", "DAMAGED"].includes(cond)) {
            existingItem.condition = cond;
          }
        }
      }
    }

    ret.status = "INSPECTED";
    ret.inspectedBy = req.user?.id;
    if (remarks) ret.remarks = remarks;
    await ret.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "RETURN_INSPECTED",
      entityType: "RETURN",
      entityId: ret._id,
      description: `Return ${ret.returnNumber} inspected and condition recorded`,
      newData: ret.toObject(),
      ipAddress: req.ip,
    });

    const populated = await Return.findById(ret._id)
      .populate("salesOrder")
      .populate("customer")
      .populate("warehouse")
      .populate("inspectedBy", "name email")
      .populate("items.product");

    res.json({ success: true, message: "Return inspected successfully", data: populated });
  } catch (error) {
    next(error);
  }
};

// 6. Complete Return & Restock Inventory (Transaction-safe)
const complete = async (req, res, next) => {
  try {
    const ret = await Return.findById(req.params.id);
    if (!ret) {
      return res.status(404).json({ success: false, message: "Return not found." });
    }

    if (ret.status === "COMPLETED") {
      return res.status(400).json({ success: false, message: "Return has already been completed." });
    }

    if (!["APPROVED", "RECEIVED", "INSPECTED"].includes(ret.status)) {
      return res.status(400).json({
        success: false,
        message: "Return must be approved, received, or inspected before completion.",
      });
    }

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};

      for (const item of ret.items) {
        let invQuery = Inventory.findOne({
          product: item.product,
          warehouse: ret.warehouse,
        });
        if (session) invQuery = invQuery.session(session);
        let inv = await invQuery;

        if (!inv) {
          if (session) {
            const created = await Inventory.create(
              [{ product: item.product, warehouse: ret.warehouse, quantity: 0, reservedStock: 0, damagedStock: 0 }],
              { session }
            );
            inv = created[0];
          } else {
            inv = await Inventory.create({
              product: item.product,
              warehouse: ret.warehouse,
              quantity: 0,
              reservedStock: 0,
              damagedStock: 0,
            });
          }
        }

        const prevQty = inv.quantity;

        // If returned item is GOOD or RESTOCKABLE: increase sellable quantity
        if (item.condition === "RESTOCKABLE" || item.condition === "GOOD") {
          inv.quantity += item.quantity;
          await inv.save(opts);

          const moveData = {
            product: item.product,
            warehouse: ret.warehouse,
            type: "RETURN_IN",
            quantity: item.quantity,
            referenceType: "RETURN",
            referenceId: ret._id,
            previousQuantity: prevQty,
            newQuantity: inv.quantity,
            performedBy: req.user?.id,
          };

          if (session) {
            await StockMovement.create([moveData], { session });
          } else {
            await StockMovement.create(moveData);
          }
        } else {
          // If returned item is DAMAGED: Do NOT increase sellable quantity.
          inv.damagedStock = (inv.damagedStock || 0) + item.quantity;
          await inv.save(opts);

          const moveData = {
            product: item.product,
            warehouse: ret.warehouse,
            type: "DAMAGED",
            quantity: item.quantity,
            referenceType: "RETURN",
            referenceId: ret._id,
            previousQuantity: prevQty,
            newQuantity: inv.quantity, // sellable inventory unchanged
            performedBy: req.user?.id,
          };

          if (session) {
            await StockMovement.create([moveData], { session });
          } else {
            await StockMovement.create(moveData);
          }
        }
      }

      ret.status = "COMPLETED";
      if (!ret.receivedBy) ret.receivedBy = req.user?.id;
      await ret.save(opts);

      await logAudit({
        employeeId: req.user?.id,
        action: "RETURN_COMPLETED",
        entityType: "RETURN",
        entityId: ret._id,
        description: `Return ${ret.returnNumber} completed, stock adjustments applied atomically`,
        newData: ret.toObject(),
        ipAddress: req.ip,
      });
    });

    const populated = await Return.findById(ret._id)
      .populate("salesOrder")
      .populate("customer")
      .populate("warehouse")
      .populate("receivedBy", "name email")
      .populate("inspectedBy", "name email")
      .populate("items.product");

    res.json({
      success: true,
      message: "Customer return completed and inventory updated safely.",
      data: populated,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  create,
  list,
  get,
  updateStatus,
  inspect,
  complete,
};

