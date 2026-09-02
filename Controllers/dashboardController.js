const Product =
    require("../Models/Product");

const Warehouse =
    require("../Models/Warehouse");

const Vendor =
    require("../Models/Vendor");

const Purchase =
    require("../Models/Purchase");

const PurchaseRequest =
    require("../Models/PurchaseRequest");

const SalesOrder =
    require("../Models/SalesOrder");

const Inventory =
    require("../Models/Inventory");

const StockMovement =
    require("../Models/StockMovement");


const getDashboard =
    async (req, res) => {

        try {

            const [
                totalProducts,
                totalWarehouses,
                totalVendors,
                pendingPurchases,
                pendingPurchaseRequests,
                pendingSalesOrders,
                inventoryRecords
            ] = await Promise.all([

                Product.countDocuments(),

                Warehouse.countDocuments(),

                Vendor.countDocuments({
                    isActive: true
                }),

                Purchase.countDocuments({
                    status: "PENDING"
                }),

                PurchaseRequest.countDocuments({
                    status: "PENDING"
                }),

                SalesOrder.countDocuments({
                    status: {
                        $in: [
                            "PENDING",
                            "CONFIRMED"
                        ]
                    }
                }),

                Inventory.find()
                    .populate("product")
                    .populate("warehouse")
            ]);


            /*
             * LOW STOCK PRODUCTS
             */
            const lowStockProducts = [];


            for (
                const inventory
                of inventoryRecords
            ) {

                if (!inventory.product) {
                    continue;
                }


                const availableStock =
                    inventory.quantity -
                    inventory.reservedStock;


                const product =
                    inventory.product;


                const reorderPoint =
                    (
                        product.averageDailyDemand *
                        product.leadTimeDays
                    ) +
                    product.safetyStock;


                if (
                    availableStock <=
                    reorderPoint
                ) {

                    lowStockProducts.push({

                        product:
                            product.productName,

                        sku:
                            product.sku,

                        warehouse:
                            inventory.warehouse
                                ? inventory.warehouse
                                    .warehouseName
                                : null,

                        availableStock,

                        reorderPoint
                    });
                }
            }


            /*
             * RECENT STOCK MOVEMENTS
             */
            const recentMovements =
                await StockMovement.find()
                    .populate("product")
                    .populate("warehouse")
                    .sort({
                        createdAt: -1
                    })
                    .limit(10);


            /*
             * TOTAL SALES
             */
            const salesResult =
                await SalesOrder.aggregate([

                    {
                        $match: {
                            status: {
                                $ne:
                                    "CANCELLED"
                            }
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            totalSales: {
                                $sum:
                                    "$totalAmount"
                            }
                        }
                    }
                ]);


            /*
             * TOTAL PURCHASE
             */
            const purchaseResult =
                await Purchase.aggregate([

                    {
                        $match: {
                            status: {
                                $ne:
                                    "CANCELLED"
                            }
                        }
                    },

                    {
                        $group: {
                            _id: null,

                            totalPurchase: {
                                $sum:
                                    "$totalAmount"
                            }
                        }
                    }
                ]);


            const totalSales =
                salesResult.length
                    ? salesResult[0].totalSales
                    : 0;


            const totalPurchase =
                purchaseResult.length
                    ? purchaseResult[0].totalPurchase
                    : 0;


            res.status(200).json({

                success: true,

                data: {

                    summary: {

                        totalProducts,

                        totalWarehouses,

                        totalVendors,

                        pendingPurchases,

                        pendingPurchaseRequests,

                        pendingSalesOrders,

                        lowStockCount:
                            lowStockProducts.length,

                        totalSales,

                        totalPurchase
                    },


                    lowStockProducts,


                    recentStockMovements:
                        recentMovements
                }
            });


        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


module.exports = {
    getDashboard
};