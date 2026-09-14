const Warehouse = require("../Models/Warehouse");
const { createCrudController } = require("../Utils/crudController");
module.exports = createCrudController(Warehouse);
