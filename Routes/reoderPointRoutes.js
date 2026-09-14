const router = require("express").Router();
const c = require("../Controllers/reorderPointController");
router.get("/:productId/:warehouseId", c.checkROP);
router.post(
  "/:productId/:warehouseId/purchase-request",
  c.generatePurchaseRequest,
);
module.exports = router;
