const router = require("express").Router();
const c = require("../Controllers/purchaseRequestController");
router.post("/", c.create);
router.get("/", c.list);
router.get("/:id", c.get);
router.put("/:id/approve", c.approve);
router.put("/:id/reject", c.reject);
module.exports = router;
