const router = require("express").Router();
const c = require("../Controllers/roleController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

// Only Super Admin can manage roles and permissions
router.use(authorize(ROLES.SUPER_ADMIN));

router.get("/permissions/all", c.permissions);
router.post("/permissions", c.createPermission);
router.get("/", c.list);
router.get("/:id", c.get);
router.post("/", c.create);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;
