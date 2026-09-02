const {
    calculateROP,
    createReorderRequest
} = require("../services/reorderPointService");


const checkROP = async (req, res) => {

    try {

        const {
            productId,
            warehouseId
        } = req.params;

        const result =
            await calculateROP(
                productId,
                warehouseId
            );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const generatePurchaseRequest =
    async (req, res) => {

        try {

            const {
                productId,
                warehouseId
            } = req.params;

            const result =
                await createReorderRequest(
                    productId,
                    warehouseId
                );

            res.status(
                result.created ? 201 : 200
            ).json({
                success: true,
                ...result
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


module.exports = {
    checkROP,
    generatePurchaseRequest
};