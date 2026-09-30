const router = require("express").Router();
const c = require("../Controllers/reorderPointController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

router.get(
  "/:productId/:warehouseId",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.checkROP
);

router.post(
  "/:productId/:warehouseId/purchase-request",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.generatePurchaseRequest
);

module.exports = router;
