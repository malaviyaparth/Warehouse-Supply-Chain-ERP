const Role = require("../Models/Role");
const Permission = require("../Models/Permission");
const list = async (req, res, next) => {
  try {
    const d = await Role.find().populate("permissions");
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
const get = async (req, res, next) => {
  try {
    const d = await Role.findById(req.params.id).populate("permissions");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const create = async (req, res, next) => {
  try {
    const d = await Role.create(req.body);
    res.status(201).json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const update = async (req, res, next) => {
  try {
    const d = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("permissions");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const remove = async (req, res, next) => {
  try {
    const d = await Role.findByIdAndDelete(req.params.id);
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    res.json({ success: true, message: "Role deleted" });
  } catch (e) {
    next(e);
  }
};
const permissions = async (req, res, next) => {
  try {
    const d = await Permission.find().populate("role", "roleName");
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
const createPermission = async (req, res, next) => {
  try {
    const d = await Permission.create(req.body);
    await Role.findByIdAndUpdate(d.role, { $addToSet: { permissions: d._id } });
    res.status(201).json({ success: true, data: d });
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
  permissions,
  createPermission,
};
