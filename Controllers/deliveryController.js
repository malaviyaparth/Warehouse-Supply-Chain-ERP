const Delivery = require("../Models/Delivery");
const SalesOrder = require("../Models/SalesOrder");
const Customer = require("../Models/Customer");
const Warehouse = require("../Models/Warehouse");
const Employee = require("../Models/Employee");
const Invoice = require("../Models/Invoice");
const { logAudit } = require("../Utils/auditLogger");

// 1. Create Delivery
const create = async (req, res, next) => {
  try {
    const {
      salesOrder,
      customer,
      warehouse,
      invoice: invoiceId,
      assignedEmployee,
      deliveryAddress,
      recipientContact,
      remarks,
    } = req.body;

    if (!salesOrder) {
      return res.status(400).json({
        success: false,
        message: "salesOrder is required.",
      });
    }

    const order = await SalesOrder.findById(salesOrder);
    if (!order) {
      return res.status(404).json({ success: false, message: "Sales order not found." });
    }

    const targetCustomer = customer || order.customer;
    const targetWarehouse = warehouse || order.warehouse;

    let targetInvoice = invoiceId;
    if (!targetInvoice) {
      const foundInv = await Invoice.findOne({ salesOrder: order._id });
      if (foundInv) targetInvoice = foundInv._id;
    }

    let empDoc = null;
    let initialStatus = "PENDING";

    if (assignedEmployee) {
      empDoc = await Employee.findById(assignedEmployee);
      if (!empDoc) {
        return res.status(404).json({ success: false, message: "Assigned employee not found." });
      }
      initialStatus = "ASSIGNED";
    }

    const deliveryNumber = `DEL-${Date.now()}`;
    const delivery = await Delivery.create({
      deliveryNumber,
      salesOrder: order._id,
      customer: targetCustomer,
      warehouse: targetWarehouse,
      invoice: targetInvoice,
      assignedEmployee: empDoc ? empDoc._id : undefined,
      deliveryAddress: deliveryAddress || "Customer Default Address",
      recipientContact: recipientContact || "",
      remarks: remarks || "",
      status: initialStatus,
      assignedAt: empDoc ? new Date() : undefined,
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "DELIVERY_CREATED",
      entityType: "DELIVERY",
      entityId: delivery._id,
      description: `Delivery ${deliveryNumber} created for Order ${order.salesOrderNumber}`,
      newData: delivery.toObject(),
      ipAddress: req.ip,
    });

    const populated = await Delivery.findById(delivery._id)
      .populate("salesOrder", "salesOrderNumber status totalAmount")
      .populate("customer", "customerName phone email")
      .populate("warehouse", "warehouseName")
      .populate("invoice", "invoiceNumber status totalAmount")
      .populate("assignedEmployee", "name email phone");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// 2. Assign Delivery
const assign = async (req, res, next) => {
  try {
    const { assignedEmployee } = req.body;
    if (!assignedEmployee) {
      return res.status(400).json({ success: false, message: "assignedEmployee is required." });
    }

    const emp = await Employee.findById(assignedEmployee);
    if (!emp) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found." });
    }

    delivery.assignedEmployee = emp._id;
    delivery.status = "ASSIGNED";
    delivery.assignedAt = new Date();
    await delivery.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "DELIVERY_ASSIGNED",
      entityType: "DELIVERY",
      entityId: delivery._id,
      description: `Delivery ${delivery.deliveryNumber} assigned to ${emp.name}`,
      newData: delivery.toObject(),
      ipAddress: req.ip,
    });

    const populated = await Delivery.findById(delivery._id)
      .populate("salesOrder", "salesOrderNumber status totalAmount")
      .populate("customer", "customerName phone email")
      .populate("warehouse", "warehouseName")
      .populate("invoice", "invoiceNumber status totalAmount")
      .populate("assignedEmployee", "name email phone");

    res.json({ success: true, message: `Delivery assigned to ${emp.name}`, data: populated });
  } catch (error) {
    next(error);
  }
};

// 3. List Deliveries
const list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.assignedEmployee) {
      filter.assignedEmployee = req.query.assignedEmployee;
    }
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }
    if (req.query.salesOrder) {
      filter.salesOrder = req.query.salesOrder;
    }
    if (req.query.warehouse) {
      filter.warehouse = req.query.warehouse;
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [total, deliveries] = await Promise.all([
      Delivery.countDocuments(filter),
      Delivery.find(filter)
        .populate("salesOrder", "salesOrderNumber status totalAmount orderDate")
        .populate("customer", "customerName phone email address")
        .populate("warehouse", "warehouseName location")
        .populate("invoice", "invoiceNumber status totalAmount")
        .populate("assignedEmployee", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      count: deliveries.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Single Delivery
const get = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate({
        path: "salesOrder",
        populate: [
          { path: "items.product", select: "productName sku unit" },
          { path: "customer", select: "customerName phone email address" },
        ],
      })
      .populate("customer")
      .populate("warehouse")
      .populate("invoice")
      .populate("assignedEmployee", "name email phone");

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found." });
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// 5. Update Delivery Status
const updateStatus = async (req, res, next) => {
  try {
    const { status, failureReason, remarks } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found." });
    }

    const oldStatus = delivery.status;
    const newStatus = status.toUpperCase();
    const validStatuses = [
      "PENDING",
      "ASSIGNED",
      "READY_FOR_DISPATCH",
      "IN_TRANSIT",
      "DELIVERED",
      "FAILED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(", ")}`,
      });
    }

    delivery.status = newStatus;
    if (remarks) delivery.remarks = remarks;

    if (newStatus === "IN_TRANSIT") {
      delivery.dispatchedAt = new Date();
      await SalesOrder.findByIdAndUpdate(delivery.salesOrder, { status: "SHIPPED" });
    } else if (newStatus === "DELIVERED") {
      delivery.deliveredAt = new Date();
      await SalesOrder.findByIdAndUpdate(delivery.salesOrder, { status: "DELIVERED" });
    } else if (newStatus === "FAILED") {
      delivery.failedAt = new Date();
      delivery.failureReason = failureReason || "Delivery attempt failed";
    }

    await delivery.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "DELIVERY_STATUS_UPDATED",
      entityType: "DELIVERY",
      entityId: delivery._id,
      description: `Delivery ${delivery.deliveryNumber} status transitioned from ${oldStatus} to ${newStatus}`,
      oldData: { status: oldStatus },
      newData: { status: newStatus, failureReason: delivery.failureReason },
      ipAddress: req.ip,
    });

    const populated = await Delivery.findById(delivery._id)
      .populate("salesOrder", "salesOrderNumber status totalAmount")
      .populate("customer", "customerName phone email")
      .populate("warehouse", "warehouseName")
      .populate("invoice", "invoiceNumber status totalAmount")
      .populate("assignedEmployee", "name email phone");

    res.json({
      success: true,
      message: `Delivery status updated to ${newStatus}`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Assigned to Me
const assignedToMe = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find({
      assignedEmployee: req.user.id,
      status: { $in: ["PENDING", "ASSIGNED", "READY_FOR_DISPATCH", "IN_TRANSIT"] },
    })
      .populate("salesOrder", "salesOrderNumber status totalAmount items")
      .populate("customer", "customerName phone email address")
      .populate("warehouse", "warehouseName location")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    next(error);
  }
};

// 7. Delivery History
const history = async (req, res, next) => {
  try {
    const filter = {
      status: { $in: ["DELIVERED", "FAILED", "CANCELLED"] },
    };

    if (req.query.assignedEmployee) {
      filter.assignedEmployee = req.query.assignedEmployee;
    }

    const deliveries = await Delivery.find(filter)
      .populate("salesOrder", "salesOrderNumber status totalAmount")
      .populate("customer", "customerName phone email address")
      .populate("warehouse", "warehouseName location")
      .populate("assignedEmployee", "name email")
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  assign,
  list,
  get,
  updateStatus,
  assignedToMe,
  history,
};

