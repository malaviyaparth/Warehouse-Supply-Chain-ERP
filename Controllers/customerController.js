const Customer = require("../Models/Customer");
const { createCrudController } = require("../Utils/crudController");
module.exports = createCrudController(Customer);
