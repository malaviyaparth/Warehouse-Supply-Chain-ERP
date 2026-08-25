const variantService = require("../services/productVariant.service");

const createVariant = async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      data: await variantService.createVariant(req.body),
    });
  } catch (error) {
    next(error);
  }
};

const getVariants = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await variantService.getVariants(req.params.productId),
    });
  } catch (error) {
    next(error);
  }
};

const getVariantById = async (req, res, next) => {
  try {
    const variant = await variantService.getVariantById(req.params.id);

    if (!variant) return res.status(404).json({ message: "Variant not found" });

    res.json({ success: true, data: variant });
  } catch (error) {
    next(error);
  }
};

const updateVariant = async (req, res, next) => {
  try {
    const variant = await variantService.updateVariant(req.params.id, req.body);

    if (!variant) return res.status(404).json({ message: "Variant not found" });

    res.json({ success: true, data: variant });
  } catch (error) {
    next(error);
  }
};

const deleteVariant = async (req, res, next) => {
  try {
    const variant = await variantService.deleteVariant(req.params.id);

    if (!variant) return res.status(404).json({ message: "Variant not found" });

    res.json({ success: true, message: "Variant deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVariant,
  getVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
};