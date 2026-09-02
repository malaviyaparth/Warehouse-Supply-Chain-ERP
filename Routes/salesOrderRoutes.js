const express = require("express");

const {
    createSalesOrder,
    getSalesOrders,
    getSalesOrderById,
    cancelSalesOrder
} = require("../Controllers/salesOrderController");

const router = express.Router();


router.post(
    "/",
    createSalesOrder
);


router.get(
    "/",
    getSalesOrders
);


router.get(
    "/:id",
    getSalesOrderById
);


router.put(
    "/:id/cancel",
    cancelSalesOrder
);


module.exports = router;