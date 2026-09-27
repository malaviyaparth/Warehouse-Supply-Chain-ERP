const router = require("express").Router();
const c = require("../Controllers/productVariantController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

router.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.SALES_MANAGER),
  c.list
);
router.get(
  "/product/:productId",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.SALES_MANAGER),
  c.byProduct
);
router.get(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.SALES_MANAGER),
  c.get
);

// Only Super Admin can mutate product variants
router.post("/", authorize(ROLES.SUPER_ADMIN), c.create);
router.put("/:id", authorize(ROLES.SUPER_ADMIN), c.update);
router.delete("/:id", authorize(ROLES.SUPER_ADMIN), c.remove);

module.exports = router;
