const StockMovement = require("../Models/StockMovement");
const list = async (req, res, next) => {
  try {
    const q = {};
    for (const k of ["product", "warehouse", "type", "referenceType"])
      if (req.query[k]) q[k] = req.query[k];
    const d = await StockMovement.find(q)
      .populate("product", "productName sku")
      .populate("warehouse", "warehouseName")
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 100, 500));
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
const byProduct = async (req, res, next) => {
  try {
    const d = await StockMovement.find({ product: req.params.productId })
      .populate("warehouse", "warehouseName")
      .populate("performedBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
module.exports = { list, byProduct };
