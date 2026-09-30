const router = require("express").Router();
const c = require("../Controllers/customerController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Only Super Admin and Sales Manager can access customers
router.post("/", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.create);
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.list);
router.get("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.get);
router.put("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.update);
router.delete("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), c.remove);

module.exports = router;
