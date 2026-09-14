const router = require("express").Router();
const c = require("../Controllers/employeeController");
const authorize = require("../Middleware/roleMiddleware");
router.post("/", authorize("ADMIN", "MANAGEMENT"), c.create);
router.get("/", c.list);
router.get("/:id", c.get);
router.put("/:id", authorize("ADMIN", "MANAGEMENT"), c.update);
router.delete("/:id", authorize("ADMIN", "MANAGEMENT"), c.remove);
module.exports = router;
