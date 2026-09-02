const mongoose = require("mongoose");

const SalesOrder =
    require("../Models/SalesOrder");

const Inventory =
    require("../Models/Inventory");


const reserveStock =
    async (req, res) => {

        const session =
            await mongoose.startSession();


        try {

            session.startTransaction();


            const order =
                await SalesOrder.findById(
                    req.params.id
                ).session(session);


            if (!order) {

                await session.abortTransaction();

                return res.status(404).json({
                    success: false,
                    message:
                        "Sales order not found"
                });
            }


            if (
                order.status !== "PENDING"
            ) {

                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        "Only pending orders can reserve stock"
                });
            }


            /*
             * STEP 1
             * Check availability
             */
            for (
                const item of order.items
            ) {

                const inventory =
                    await Inventory.findOne({
                        product:
                            item.product,

                        warehouse:
                            order.warehouse
                    }).session(session);


                if (!inventory) {

                    await session.abortTransaction();

                    return res.status(400).json({
                        success: false,
                        message:
                            "Inventory not found"
                    });
                }


                const availableStock =
                    inventory.quantity -
                    inventory.reservedStock;


                if (
                    availableStock <
                    item.quantity
                ) {

                    await session.abortTransaction();

                    return res.status(400).json({
                        success: false,
                        message:
                            "Insufficient available stock"
                    });
                }
            }


            /*
             * STEP 2
             * Reserve stock
             */
            for (
                const item of order.items
            ) {

                const inventory =
                    await Inventory.findOne({
                        product:
                            item.product,

                        warehouse:
                            order.warehouse
                    }).session(session);


                inventory.reservedStock +=
                    item.quantity;


                await inventory.save({
                    session
                });
            }


            /*
             * STEP 3
             * Confirm order
             */
            order.status =
                "CONFIRMED";


            await order.save({
                session
            });


            await session.commitTransaction();


            res.status(200).json({
                success: true,
                message:
                    "Stock reserved successfully",
                data: order
            });


        } catch (error) {

            await session.abortTransaction();

            res.status(500).json({
                success: false,
                message: error.message
            });


        } finally {

            session.endSession();
        }
    };


module.exports = {
    reserveStock
};