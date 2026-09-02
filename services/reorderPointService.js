const Product = require("../Models/Product");
const Inventory = require("../Models/Inventory");
const PurchaseRequest = require("../Models/PurchaseRequest");

const calculateROP = async (
    productId,
    warehouseId
) => {

    const product =
        await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found");
    }

    const inventory =
        await Inventory.findOne({
            product: productId,
            warehouse: warehouseId
        });

    const currentStock =
        inventory
            ? inventory.quantity
            : 0;

    const reservedStock =
        inventory
            ? inventory.reservedStock
            : 0;

    const availableStock =
        currentStock - reservedStock;

    const reorderPoint =
        (
            product.averageDailyDemand *
            product.leadTimeDays
        ) +
        product.safetyStock;

    const needsReorder =
        availableStock <= reorderPoint;

    return {
        productId,
        warehouseId,

        currentStock,

        reservedStock,

        availableStock,

        averageDailyDemand:
            product.averageDailyDemand,

        leadTimeDays:
            product.leadTimeDays,

        safetyStock:
            product.safetyStock,

        reorderPoint,

        needsReorder
    };
};


/*
 * Create Purchase Request
 * when stock reaches ROP.
 */
const createReorderRequest = async (
    productId,
    warehouseId
) => {

    const result =
        await calculateROP(
            productId,
            warehouseId
        );

    if (!result.needsReorder) {
        return {
            created: false,
            message:
                "Stock is above reorder point",
            data: result
        };
    }

    /*
     * Check whether a pending
     * request already exists.
     */
    const existingRequest =
        await PurchaseRequest.findOne({
            warehouse: warehouseId,
            status: "PENDING",
            reason: "LOW_STOCK",
            "items.product": productId
        });

    if (existingRequest) {
        return {
            created: false,
            message:
                "Pending purchase request already exists",
            data: existingRequest
        };
    }

    /*
     * Order enough to reach
     * the reorder point plus
     * one lead-time demand cycle.
     */
    const targetStock =
        result.reorderPoint +
        (
            result.averageDailyDemand *
            result.leadTimeDays
        );

    const requiredQuantity =
        Math.max(
            1,
            Math.ceil(
                targetStock -
                result.availableStock
            )
        );

    const requestNumber =
        `PR-${Date.now()}`;

    const purchaseRequest =
        await PurchaseRequest.create({
            requestNumber,

            warehouse: warehouseId,

            items: [
                {
                    product: productId,
                    quantity: requiredQuantity
                }
            ],

            reason: "LOW_STOCK",

            status: "PENDING"
        });

    return {
        created: true,

        message:
            "Purchase request created successfully",

        data: purchaseRequest
    };
};


module.exports = {
    calculateROP,
    createReorderRequest
};