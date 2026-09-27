const salesOrderController = require("./salesOrderController");

// Canonical stock reservation delegates to salesOrderController.reserve
const reserveStock = async (req, res, next) => {
  return salesOrderController.reserve(req, res, next);
};

module.exports = {
  reserveStock,
};
