const router = require("express").Router();
const c = require("../Controllers/invoiceController");
router.get("/", c.list);
router.get("/:id", c.get);
router.put("/:id/payment", c.updatePayment);
module.exports = router;
