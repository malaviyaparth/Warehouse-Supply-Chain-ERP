const Vendor = require("../Models/Vendor");
const { createCrudController } = require("../Utils/crudController");
module.exports = createCrudController(Vendor);
