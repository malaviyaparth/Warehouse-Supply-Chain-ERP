const router = require("express").Router();
const permissionController = require("../Controllers/permissionController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

router.use(authorize(ROLES.SUPER_ADMIN));

router.get("/", permissionController.list);
router.post("/", permissionController.create);

module.exports = router;
