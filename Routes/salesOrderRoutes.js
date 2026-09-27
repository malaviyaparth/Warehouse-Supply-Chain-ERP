const router = require("express").Router();
const c = require("../Controllers/salesOrderController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// View sales orders: Super Admin, Sales Manager, Warehouse Manager (for fulfillment/picking)
router.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.list
);

router.get(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.get
);

router.get(
  "/:id/availability",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.checkAvailability
);

// Manage / Create / Reserve / Fulfill / Cancel / Invoice: Super Admin & Sales Manager only
router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER),
  c.create
);

router.put(
  "/:id/reserve",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER),
  c.reserve
);

router.put(
  "/:id/fulfill",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER),
  c.fulfill
);

router.put(
  "/:id/cancel",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER),
  c.cancel
);

router.post(
  "/:id/invoice",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER),
  c.invoice
);

module.exports = router;
