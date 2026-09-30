const router = require("express").Router();
const c = require("../Controllers/vendorController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Only Super Admin and Purchase Manager can access vendors
router.post("/", authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER), c.create);
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER), c.list);
router.get("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER), c.get);
router.put("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER), c.update);
router.delete("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PURCHASE_MANAGER), c.remove);

module.exports = router;
