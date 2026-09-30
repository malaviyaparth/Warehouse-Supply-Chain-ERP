const router = require("express").Router();
const c = require("../Controllers/stockMovementController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Stock Movement Ledger: Super Admin and Warehouse Manager
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER), c.list);
router.get("/product/:productId", authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER), c.byProduct);

module.exports = router;
