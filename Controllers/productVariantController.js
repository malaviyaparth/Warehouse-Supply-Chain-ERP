const ProductVariant = require("../Models/ProductVariant");
const Product = require("../Models/Product");
const { createCrudController } = require("../Utils/crudController");

const base = createCrudController(ProductVariant, {
  populate: [{ path: "product", select: "productName sku" }],
});

const getByProduct = async (req, res, next) => {
  try {
    const docs = await ProductVariant.find({ product: req.params.productId })
      .populate("product", "productName sku")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  ...base,
  getByProduct,
  byProduct: getByProduct,
};
