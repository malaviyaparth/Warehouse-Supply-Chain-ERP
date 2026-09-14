const Category = require("../Models/Category");
const { createCrudController } = require("../Utils/crudController");
module.exports = createCrudController(Category);
