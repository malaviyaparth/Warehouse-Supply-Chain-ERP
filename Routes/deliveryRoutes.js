const router = require("express").Router();
const c = require("../Controllers/deliveryController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Delivery View: Super Admin, Sales Manager, and Warehouse Manager (to view/prepare goods)
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER), c.list);
router.get("/assigned-to-me", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER), c.assignedToMe);
router.get("/history", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER), c.history);
router.get("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER), c.get);

// Delivery Management: Super Admin and Sales Manager only
router.post("/", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.create);
router.put("/:id/assign", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.assign);
router.put("/:id/status", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.updateStatus);

module.exports = router;

