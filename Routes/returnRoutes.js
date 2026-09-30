const router = require("express").Router();
const c = require("../Controllers/returnController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Return View: Super Admin, Sales Manager, Warehouse Manager
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER), c.list);
router.get("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER), c.get);

// Return Request Management: Super Admin and Sales Manager
router.post("/", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.create);

// Physical Inspection: Warehouse Manager and Super Admin
router.put("/:id/inspect", authorize(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_MANAGER), c.inspect);

// Status Transitions: Super Admin, Sales Manager, and Warehouse Manager (for receiving/inspecting)
router.put(
  "/:id/status",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER),
  c.updateStatus
);

// Completion / Restocking: Super Admin and Sales Manager
router.put("/:id/complete", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.complete);

module.exports = router;

