const express = require("express");

const {
    checkROP,
    generatePurchaseRequest
} = require("../Controllers/reorderPointController");

const router = express.Router();


/*
 * Calculate ROP
 */
router.get(
    "/:productId/:warehouseId",
    checkROP
);


/*
 * Check ROP and create
 * Purchase Request if required
 */
router.post(
    "/:productId/:warehouseId/purchase-request",
    generatePurchaseRequest
);


module.exports = router;