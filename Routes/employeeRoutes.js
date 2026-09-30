const router = require("express").Router();
const c = require("../Controllers/employeeController");
const authorize = require("../Middleware/roleMiddleware");
const checkPermission = require("../Middleware/permissionMiddleware");
const { ROLES } = authorize;

router.use(authorize(ROLES.SUPER_ADMIN));

router.get("/", c.list);
router.get("/:id", c.get);
router.post("/", checkPermission("employee.manage"), c.create);
router.put("/:id", checkPermission("employee.manage"), c.update);
router.delete("/:id", checkPermission("employee.manage"), c.remove);

module.exports = router;
