const router = require("express").Router();
const c = require("../Controllers/reportController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

router.get(
  "/:type",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.SALES_MANAGER),
  c.report
);

module.exports = router;
