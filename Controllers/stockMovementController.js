const StockMovement = require("../Models/StockMovement");

const getStockMovements = async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate("product", "productName sku")
      .populate("warehouse", "warehouseName")
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(movements);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getProductMovements = async (req, res) => {
  try {
    const movements = await StockMovement.find({
      product: req.params.productId
    })
      .populate("warehouse", "warehouseName")
      .sort({ createdAt: -1 });

    res.status(200).json(movements);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getStockMovements,
  getProductMovements
};