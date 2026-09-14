const router = require("express").Router();
const c = require("../Controllers/stockTransferController");
router.post("/", c.create);
router.get("/", c.list);
router.get("/:id", c.get);
router.put("/:id/approve", c.approve);
router.put("/:id/complete", c.complete);
module.exports = router;
