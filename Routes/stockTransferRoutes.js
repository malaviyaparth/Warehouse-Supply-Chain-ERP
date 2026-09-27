const router = require("express").Router();
const c = require("../Controllers/stockTransferController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Stock Transfers View: Super Admin, Warehouse Manager, Purchase Manager, and Sales Manager
router.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.PURCHASE_MANAGER, ROLES.SALES_MANAGER),
  c.list
);
router.get(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.PURCHASE_MANAGER, ROLES.SALES_MANAGER),
  c.get
);

// Stock Transfers Management: Super Admin and Warehouse Manager only
router.post("/", authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER), c.create);
router.put("/:id/approve", authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER), c.approve);
router.put("/:id/dispatch", authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER), c.dispatch);
router.put("/:id/complete", authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER), c.complete);

module.exports = router;

