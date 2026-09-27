const router = require("express").Router();
const c = require("../Controllers/purchaseController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// View Purchase Orders
router.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.list
);

router.get(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.get
);

// Manage / Create / Approve / Cancel POs: Super Admin & Purchase Manager only
router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER),
  c.create
);

router.put(
  "/:id/approve",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER),
  c.approve
);

router.put(
  "/:id/cancel",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER),
  c.cancel
);

// Receiving goods against PO: Super Admin, Purchase Manager, Warehouse Manager
router.put(
  "/:id/receive",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.receive
);

module.exports = router;
