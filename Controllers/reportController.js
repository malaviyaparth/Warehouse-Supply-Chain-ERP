const Product = require("../Models/Product"),
  Inventory = require("../Models/Inventory"),
  PurchaseOrder = require("../Models/PurchaseOrder"),
  SalesOrder = require("../Models/SalesOrder"),
  StockMovement = require("../Models/StockMovement"),
  Vendor = require("../Models/Vendor");
const report = async (req, res, next) => {
  try {
    const type = (req.params.type || "INVENTORY").toUpperCase();
    let data;
    switch (type) {
      case "INVENTORY":
        data = await Inventory.find()
          .populate("product", "productName sku unitPrice")
          .populate("warehouse", "warehouseName");
        break;
      case "PURCHASE":
        data = await PurchaseOrder.find()
          .populate("vendor", "vendorName")
          .populate("warehouse", "warehouseName");
        break;
      case "SALES":
        data = await SalesOrder.find()
          .populate("customer", "customerName")
          .populate("warehouse", "warehouseName");
        break;
      case "STOCK_TRANSFER":
        data = await StockMovement.find({
          type: { $in: ["TRANSFER_IN", "TRANSFER_OUT"] },
        });
        break;
      case "VENDOR":
        data = await Vendor.find();
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Unsupported report type" });
    }
    res.json({ success: true, reportType: type, count: data.length, data });
  } catch (e) {
    next(e);
  }
};
module.exports = { report };
