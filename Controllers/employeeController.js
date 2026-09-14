const Employee = require("../Models/Employee");
const { hashPassword } = require("../services/auth");
const create = async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.name || !b.email || !b.password || !b.department || !b.role)
      return res
        .status(400)
        .json({
          success: false,
          message: "name, email, password, department and role are required",
        });
    const d = await Employee.create({
      ...b,
      password: await hashPassword(b.password),
    });
    const out = await Employee.findById(d._id)
      .populate("role", "roleName permissions")
      .select("-password");
    res.status(201).json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
};
const list = async (req, res, next) => {
  try {
    const docs = await Employee.find()
      .populate("role", "roleName permissions")
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (e) {
    next(e);
  }
};
const get = async (req, res, next) => {
  try {
    const d = await Employee.findById(req.params.id)
      .populate("role", "roleName permissions")
      .select("-password");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const update = async (req, res, next) => {
  try {
    const b = { ...req.body };
    if (b.password) b.password = await hashPassword(b.password);
    const d = await Employee.findByIdAndUpdate(req.params.id, b, {
      new: true,
      runValidators: true,
    })
      .populate("role", "roleName permissions")
      .select("-password");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const remove = async (req, res, next) => {
  try {
    const d = await Employee.findByIdAndUpdate(
      req.params.id,
      { status: "INACTIVE" },
      { new: true },
    );
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    res.json({ success: true, message: "Employee deactivated" });
  } catch (e) {
    next(e);
  }
};
module.exports = { create, list, get, update, remove };
