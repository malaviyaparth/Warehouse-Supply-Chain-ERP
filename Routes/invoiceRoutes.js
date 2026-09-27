const router = require("express").Router();
const c = require("../Controllers/invoiceController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Invoices View: Super Admin, Sales Manager, and Warehouse Manager (where necessary)
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

// Invoices Management: Super Admin and Sales Manager only (Purchase Manager forbidden)
router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER),
  c.create
);

router.put(
  "/:id/payment",
  authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER),
  c.updatePayment
);

module.exports = router;

