const router = require("express").Router();
const c = require("../Controllers/stockMovementController");
router.get("/", c.list);
router.get("/product/:productId", c.byProduct);
module.exports = router;
