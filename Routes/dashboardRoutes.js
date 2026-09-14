const router = require("express").Router();
const c = require("../Controllers/dashboardController");
router.get("/", c.getDashboard);
module.exports = router;
