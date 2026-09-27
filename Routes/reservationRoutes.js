const express = require("express");
const { reserveStock } = require("../Controllers/reservationController");
const authorize = require("../Middleware/roleMiddleware");
const { ROLES } = authorize;

const router = express.Router();

router.put("/:id/reserve", authorize(ROLES.SUPER_ADMIN, ROLES.SALES_MANAGER), reserveStock);

module.exports = router;
