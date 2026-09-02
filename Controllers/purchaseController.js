const mongoose = require("mongoose");

const Purchase = require("../Models/Purchase");
const Vendor = require("../Models/Vendor");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");


// CREATE PURCHASE ORDER
const createPurchase = async (req, res) => {
    try {
        const {
            purchaseOrderNumber,
            vendor,
            warehouse,
            items
        } = req.body;

        if (!purchaseOrderNumber || !vendor || !warehouse) {
            return res.status(400).json({
                success: false,
                message:
                    "Purchase order number, vendor and warehouse are required"
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Purchase must contain at least one item"
            });
        }

        const existingPurchase =
            await Purchase.findOne({
                purchaseOrderNumber
            });

        if (existingPurchase) {
            return res.status(400).json({
                success: false,
                message:
                    "Purchase order number already exists"
            });
        }

        const vendorExists =
            await Vendor.findById(vendor);

        if (!vendorExists) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        let totalAmount = 0;

        const purchaseItems = items.map((item) => {
            const totalPrice =
                item.quantity * item.unitPrice;

            totalAmount += totalPrice;

            return {
                product: item.product,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice
            };
        });

        const purchase = await Purchase.create({
            purchaseOrderNumber,
            vendor,
            warehouse,
            items: purchaseItems,
            totalAmount,
            status: "PENDING"
        });

        const populatedPurchase =
            await Purchase.findById(purchase._id)
                .populate("vendor")
                .populate("warehouse")
                .populate("items.product");

        res.status(201).json({
            success: true,
            message: "Purchase order created successfully",
            data: populatedPurchase
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL PURCHASES
const getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find()
            .populate("vendor")
            .populate("warehouse")
            .populate("items.product")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: purchases.length,
            data: purchases
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET PURCHASE BY ID
const getPurchaseById = async (req, res) => {
    try {
        const purchase =
            await Purchase.findById(req.params.id)
                .populate("vendor")
                .populate("warehouse")
                .populate("items.product");

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found"
            });
        }

        res.status(200).json({
            success: true,
            data: purchase
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// CANCEL PURCHASE
const cancelPurchase = async (req, res) => {
    try {
        const purchase =
            await Purchase.findById(req.params.id);

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found"
            });
        }

        if (purchase.status === "RECEIVED") {
            return res.status(400).json({
                success: false,
                message:
                    "Received purchase cannot be cancelled"
            });
        }

        purchase.status = "CANCELLED";

        await purchase.save();

        res.status(200).json({
            success: true,
            message: "Purchase cancelled successfully",
            data: purchase
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// RECEIVE PURCHASED GOODS
const receivePurchase = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const purchase =
            await Purchase.findById(
                req.params.id
            ).session(session);

        if (!purchase) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Purchase order not found"
            });
        }

        if (purchase.status !== "PENDING") {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Only pending purchases can be received"
            });
        }

        for (const item of purchase.items) {

            let inventory =
                await Inventory.findOne({
                    product: item.product,
                    warehouse: purchase.warehouse
                }).session(session);

            // CREATE INVENTORY IF IT DOES NOT EXIST
            if (!inventory) {
                inventory = new Inventory({
                    product: item.product,
                    warehouse: purchase.warehouse,
                    quantity: 0,
                    reservedStock: 0,
                    damagedStock: 0
                });
            }

            const previousQuantity =
                inventory.quantity;

            const newQuantity =
                previousQuantity + item.quantity;

            inventory.quantity = newQuantity;

            await inventory.save({
                session
            });

            // CREATE STOCK MOVEMENT
            await StockMovement.create(
                [
                    {
                        product: item.product,
                        warehouse: purchase.warehouse,
                        type: "STOCK_IN",
                        quantity: item.quantity,
                        referenceType: "PURCHASE",
                        referenceId: purchase._id,
                        previousQuantity,
                        newQuantity,
                        performedBy:
                            req.employee
                                ? req.employee._id
                                : undefined
                    }
                ],
                {
                    session
                }
            );
        }

        purchase.status = "RECEIVED";
        purchase.receivedAt = new Date();

        await purchase.save({
            session
        });

        await session.commitTransaction();

        const updatedPurchase =
            await Purchase.findById(
                purchase._id
            )
                .populate("vendor")
                .populate("warehouse")
                .populate("items.product");

        res.status(200).json({
            success: true,
            message:
                "Goods received and inventory updated successfully",
            data: updatedPurchase
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