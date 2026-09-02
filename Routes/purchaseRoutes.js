const express = require("express");

const {
    createPurchase,
    getPurchases,
    getPurchaseById,
    cancelPurchase,
    receivePurchase
} = require("../Controllers/purchaseController");

const router = express.Router();


// CREATE PURCHASE ORDER
router.post("/", createPurchase);


// GET ALL PURCHASE ORDERS
router.get("/", getPurchases);


// GET PURCHASE BY ID
router.get("/:id", getPurchaseById);


// RECEIVE GOODS
router.put(
    "/:id/receive",
    receivePurchase
);


// CANCEL PURCHASE
router.put(
    "/:id/cancel",
    cancelPurchase
);


module.exports = router;