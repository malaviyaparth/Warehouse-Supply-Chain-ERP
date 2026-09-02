const express = require("express");

const {
  getStockMovements,
  getProductMovements
} = require("../controllers/stockMovementController");

const router = express.Router();

router.get("/", getStockMovements);

router.get(
  "/product/:productId",
  getProductMovements
);

module.exports = router;