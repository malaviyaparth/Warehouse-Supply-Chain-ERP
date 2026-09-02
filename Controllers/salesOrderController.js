const SalesOrder =
    require("../Models/SalesOrder");

const Product =
    require("../Models/Product");


const createSalesOrder =
    async (req, res) => {

        try {

            const {
                salesOrderNumber,
                customerName,
                customerEmail,
                customerPhone,
                warehouse,
                items
            } = req.body;


            if (
                !salesOrderNumber ||
                !customerName ||
                !customerPhone ||
                !warehouse
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Required sales order information is missing"
                });
            }


            if (
                !items ||
                items.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Sales order must contain items"
                });
            }


            const existing =
                await SalesOrder.findOne({
                    salesOrderNumber
                });


            if (existing) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Sales order number already exists"
                });
            }


            let totalAmount = 0;

            const orderItems = [];


            for (const item of items) {

                const product =
                    await Product.findById(
                        item.product
                    );


                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Product not found"
                    });
                }


                const totalPrice =
                    item.quantity *
                    item.unitPrice;


                totalAmount += totalPrice;


                orderItems.push({
                    product:
                        item.product,

                    quantity:
                        item.quantity,

                    unitPrice:
                        item.unitPrice,

                    totalPrice
                });
            }


            const order =
                await SalesOrder.create({
                    salesOrderNumber,

                    customerName,

                    customerEmail,

                    customerPhone,

                    warehouse,

                    items: orderItems,

                    totalAmount,

                    status: "PENDING"
                });


            const result =
                await SalesOrder.findById(
                    order._id
                )
                    .populate("warehouse")
                    .populate("items.product");


            res.status(201).json({
                success: true,
                message:
                    "Sales order created successfully",
                data: result
            });


        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


const getSalesOrders =
    async (req, res) => {

        try {

            const orders =
                await SalesOrder.find()
                    .populate("warehouse")
                    .populate("items.product")
                    .sort({
                        createdAt: -1
                    });


            res.status(200).json({
                success: true,
                count: orders.length,
                data: orders
            });


        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


const getSalesOrderById =
    async (req, res) => {

        try {

            const order =
                await SalesOrder.findById(
                    req.params.id
                )
                    .populate("warehouse")
                    .populate("items.product");


            if (!order) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Sales order not found"
                });
            }


            res.status(200).json({
                success: true,
                data: order
            });


        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


const cancelSalesOrder =
    async (req, res) => {

        try {

            const order =
                await SalesOrder.findById(
                    req.params.id
                );


            if (!order) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Sales order not found"
                });
            }


            if (
                [
                    "SHIPPED",
                    "DELIVERED"
                ].includes(order.status)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Shipped or delivered order cannot be cancelled"
                });
            }


            order.status = "CANCELLED";

            await order.save();


            res.status(200).json({
                success: true,
                message:
                    "Sales order cancelled successfully",
                data: order
            });


        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


module.exports = {
    createSalesOrder,
    getSalesOrders,
    getSalesOrderById,
    cancelSalesOrder
};