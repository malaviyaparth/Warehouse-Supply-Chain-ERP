const router = require("express").Router();
const c = require("../Controllers/auditLogController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Audit logs: Super Admin and other authorized roles (scoped by controller)
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.SALES_MANAGER));

router.get("/", c.list);
router.get("/:id", c.get);

module.exports = router;

