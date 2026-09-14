const Brand = require("../Models/Brand");
const { createCrudController } = require("../Utils/crudController");
module.exports = createCrudController(Brand);
