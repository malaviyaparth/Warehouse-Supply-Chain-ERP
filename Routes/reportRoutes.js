const router = require("express").Router();
const c = require("../Controllers/reportController");
router.get("/:type", c.report);
module.exports = router;
