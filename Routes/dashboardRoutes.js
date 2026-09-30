const router = require("express").Router();
const c = require("../Controllers/dashboardController");

router.get("/", c.getDashboard);
router.get("/stats", c.getDashboard);
router.get("/summary", c.getDashboard);

module.exports = router;
