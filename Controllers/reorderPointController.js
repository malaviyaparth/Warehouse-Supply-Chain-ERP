const {
  calculateROP,
  createReorderRequest,
} = require("../services/reorderPointService");
const checkROP = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await calculateROP(req.params.productId, req.params.warehouseId),
    });
  } catch (e) {
    next(e);
  }
};
const generatePurchaseRequest = async (req, res, next) => {
  try {
    const r = await createReorderRequest(
      req.params.productId,
      req.params.warehouseId,
      req.user?.id,
    );
    res.status(r.created ? 201 : 200).json({ success: true, ...r });
  } catch (e) {
    next(e);
  }
};
module.exports = { checkROP, generatePurchaseRequest };
