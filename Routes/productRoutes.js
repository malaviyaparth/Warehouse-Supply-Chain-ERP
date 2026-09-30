const router = require("express").Router();
const c = require("../Controllers/productController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

router.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.SALES_MANAGER),
  c.list
);
router.get(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.SALES_MANAGER),
  c.get
);

// Only Super Admin can mutate master products
router.post("/", authorize(ROLES.SUPER_ADMIN), c.create);
router.put("/:id", authorize(ROLES.SUPER_ADMIN), c.update);
router.delete("/:id", authorize(ROLES.SUPER_ADMIN), c.remove);

module.exports = router;
