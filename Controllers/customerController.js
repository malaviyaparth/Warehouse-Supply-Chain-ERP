const Customer = require("../Models/Customer");
const SalesOrder = require("../Models/SalesOrder");
const Invoice = require("../Models/Invoice");
const Return = require("../Models/Return");
const { validId } = require("../Utils/crudController");

const list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) {
      q.status = req.query.status.toUpperCase();
    }
    const docs = await Customer.find(q).sort({ createdAt: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Customer ID" });
    }
    const doc = await Customer.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    const { customerName, phone, email, address, status } = req.body;
    if (!customerName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone are required",
      });
    }

    const doc = await Customer.create({
      customerName,
      phone,
      email,
      address,
      status: status ? status.toUpperCase() : "ACTIVE",
    });

    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Customer ID" });
    }

    const doc = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ success: false, message: "Invalid Customer ID" });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Check if referenced in historical transactions
    const [hasSo, hasInv, hasReturn] = await Promise.all([
      SalesOrder.exists({ customer: id }),
      Invoice.exists({ customer: id }),
      Return.exists({ customer: id }),
    ]);

    if (hasSo || hasInv || hasReturn) {
      // Soft-delete by setting status to INACTIVE to preserve historical integrity
      customer.status = "INACTIVE";
      await customer.save();

      return res.status(200).json({
        success: true,
        message: "Customer has historical transactions and cannot be physically deleted. Customer status has been set to INACTIVE.",
        data: customer,
        deactivated: true,
      });
    }

    // No historical transactions exist: physical deletion is safe
    await Customer.findByIdAndDelete(id);
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  list,
  get,
  create,
  update,
  remove,
};
