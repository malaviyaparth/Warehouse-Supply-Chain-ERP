const express = require("express");

const { reserveStock } = require("../Controllers/reservationController");

const router = express.Router();

router.put("/:id/reserve", reserveStock);

module.exports = router;
