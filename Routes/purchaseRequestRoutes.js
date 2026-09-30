const router = require("express").Router();
const c = require("../Controllers/purchaseRequestController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// View PRs: Super Admin, Purchase Manager, Warehouse Manager
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

// Create PRs: Super Admin, Purchase Manager, Warehouse Manager (for warehouse shortages)
router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.create
);

// Approve / Reject / Cancel: Super Admin and Purchase Manager only
router.put(
  "/:id/approve",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER),
  c.approve
);

router.put(
  "/:id/reject",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER),
  c.reject
);

router.put(
  "/:id/cancel",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER),
  c.cancel
);

module.exports = router;
