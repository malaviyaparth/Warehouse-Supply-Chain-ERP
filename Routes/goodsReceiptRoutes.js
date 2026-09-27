const router = require("express").Router();
const c = require("../Controllers/goodsReceiptController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Goods Receipts: Super Admin, Purchase Manager, Warehouse Manager
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

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.create
);

module.exports = router;
