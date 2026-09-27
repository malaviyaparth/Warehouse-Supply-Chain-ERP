const Permission = require("../Models/Permission");

const list = async (req, res, next) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, permissionName: 1 });
    res.json({ success: true, count: permissions.length, data: permissions });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { permissionName, module: moduleName, description } = req.body;
    if (!permissionName || !moduleName) {
      return res.status(400).json({ success: false, message: "permissionName and module are required" });
    }
    const permission = await Permission.create({
      permissionName: permissionName.toLowerCase().trim(),
      module: moduleName.toUpperCase().trim(),
      description,
    });
    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create };
