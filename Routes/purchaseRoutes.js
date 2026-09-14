const router = require("express").Router();
const c = require("../Controllers/purchaseController");
router.post("/", c.create);
router.get("/", c.list);
router.get("/:id", c.get);
router.put("/:id/approve", c.approve);
router.put("/:id/receive", c.receive);
router.put("/:id/cancel", c.cancel);
module.exports = router;
