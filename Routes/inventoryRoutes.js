const router = require("express").Router();
const c = require("../Controllers/inventoryController");
router.get("/", c.list);
router.get("/:id", c.get);
router.put("/", c.upsert);
router.put("/:id/adjust", c.adjust);
module.exports = router;
