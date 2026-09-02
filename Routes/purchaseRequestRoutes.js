const express = require("express");

const {
    createPurchaseRequest,
    getPurchaseRequests,
    getPurchaseRequestById,
    approvePurchaseRequest,
    rejectPurchaseRequest
} = require("../Controllers/purchaseRequestController");

const router = express.Router();


router.post(
    "/",
    createPurchaseRequest
);


router.get(
    "/",
    getPurchaseRequests
);


router.get(
    "/:id",
    getPurchaseRequestById
);


router.put(
    "/:id/approve",
    approvePurchaseRequest
);


router.put(
    "/:id/reject",
    rejectPurchaseRequest
);


module.exports = router;