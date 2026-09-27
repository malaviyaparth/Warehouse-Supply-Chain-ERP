const GoodsReceipt = require("../Models/GoodsReceipt");
const PurchaseOrder = require("../Models/PurchaseOrder");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const { logAudit } = require("../Utils/auditLogger");
const { runInTransaction } = require("../Utils/dbTransactions");
const { validId } = require("../Utils/crudController");

// 1. Create Goods Receipt & Ingest Stock atomically
const create = async (req, res, next) => {
  try {
    const { purchaseOrder, warehouse, items, receivedItems, remarks } = req.body;
    const rawItems = items || receivedItems;

    if (!purchaseOrder || !rawItems || !rawItems.length) {
      return res.status(400).json({
        success: false,
        message: "purchaseOrder and items (or receivedItems) are required.",
      });
    }

    if (!validId(purchaseOrder)) {
      return res.status(400).json({ success: false, message: "Invalid purchase order ID." });
    }

    const po = await PurchaseOrder.findById(purchaseOrder);
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase order not found." });
    }

    if (po.status === "CANCELLED" || po.status === "DRAFT") {
      return res.status(400).json({
        success: false,
        message: `Cannot receive goods for a purchase order with status: ${po.status}.`,
      });
    }

    if (po.status === "RECEIVED") {
      return res.status(400).json({
        success: false,
        message: "Purchase order has already been fully received.",
      });
    }

    const targetWarehouse = warehouse || po.warehouse;

    const result = await runInTransaction(async (session) => {
      const activePo = await PurchaseOrder.findById(po._id).session(session);
      const processedItems = [];

      for (const receiptItem of rawItems) {
        const poItem = activePo.items.find(
          (i) => String(i.product) === String(receiptItem.product)
        );

        if (!poItem) {
          throw new Error(`Product ${receiptItem.product} is not part of this Purchase Order.`);
        }

        const receivedQty = Number(receiptItem.receivedQuantity || 0);
        const damagedQty = Number(receiptItem.damagedQuantity || 0);
        const remainingAllowed = poItem.quantity - poItem.receivedQuantity;

        if (receivedQty < 0 || damagedQty < 0) {
          const err = new Error("Quantities cannot be negative.");
          err.statusCode = 400;
          throw err;
        }

        if (receivedQty > remainingAllowed) {
          const err = new Error(
            `Over-receiving prevented: Received quantity (${receivedQty}) exceeds remaining allowed (${remainingAllowed}) for product ${receiptItem.product}.`
          );
          err.statusCode = 400;
          throw err;
        }

        if (receivedQty > 0 || damagedQty > 0) {
          let inv = await Inventory.findOne({
            product: receiptItem.product,
            warehouse: targetWarehouse,
          }).session(session);

          if (!inv) {
            inv = new Inventory({
              product: receiptItem.product,
              warehouse: targetWarehouse,
              quantity: 0,
              damagedStock: 0,
            });
          }

          const prevQty = inv.quantity;

          // Ingest clean quantity into physical inventory
          if (receivedQty > 0) {
            inv.quantity += receivedQty;
            poItem.receivedQuantity += receivedQty;

            await StockMovement.create(
              [
                {
                  product: receiptItem.product,
                  warehouse: targetWarehouse,
                  type: "STOCK_IN",
                  quantity: receivedQty,
                  referenceType: "PURCHASE",
                  referenceId: activePo._id,
                  previousQuantity: prevQty,
                  newQuantity: inv.quantity,
                  performedBy: req.user?.id,
                  remarks: remarks || `Goods received for PO ${activePo.purchaseOrderNumber}`,
                },
              ],
              { session }
            );
          }

          // Handle damaged items upon intake (isolated from sellable stock)
          if (damagedQty > 0) {
            inv.damagedStock = (inv.damagedStock || 0) + damagedQty;

            await StockMovement.create(
              [
                {
                  product: receiptItem.product,
                  warehouse: targetWarehouse,
                  type: "DAMAGED",
                  quantity: damagedQty,
                  referenceType: "PURCHASE",
                  referenceId: activePo._id,
                  previousQuantity: prevQty,
                  newQuantity: inv.quantity,
                  performedBy: req.user?.id,
                  remarks: `Quarantined damaged items on intake: PO ${activePo.purchaseOrderNumber}`,
                },
              ],
              { session }
            );
          }

          await inv.save({ session });
        }

        processedItems.push({
          product: receiptItem.product,
          orderedQuantity: poItem.quantity,
          receivedQuantity: receivedQty,
          damagedQuantity: damagedQty,
        });
      }

      // Update PO status: PARTIALLY_RECEIVED or RECEIVED
      const allCompleted = activePo.items.every((i) => i.receivedQuantity >= i.quantity);
      activePo.status = allCompleted ? "RECEIVED" : "PARTIALLY_RECEIVED";
      await activePo.save({ session });

      const grDocs = await GoodsReceipt.create(
        [
          {
            purchaseOrder: activePo._id,
            warehouse: targetWarehouse,
            receivedBy: req.user?.id,
            receiptDate: new Date(),
            items: processedItems,
            remarks: remarks || "",
          },
        ],
        { session }
      );

      return { receipt: grDocs[0], po: activePo };
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "GOODS_RECEIPT_RECORDED",
      entityType: "PURCHASE_ORDER",
      entityId: po._id,
      description: `Goods receipt recorded for PO ${po.purchaseOrderNumber}, status updated to ${result.po.status}`,
      newData: result.receipt.toObject(),
      ipAddress: req.ip,
    });

    const populated = await GoodsReceipt.findById(result.receipt._id)
      .populate("purchaseOrder", "purchaseOrderNumber status totalAmount")
      .populate("warehouse", "warehouseName location")
      .populate("receivedBy", "name email")
      .populate("items.product", "productName sku");

    res.status(201).json({
      success: true,
      message: `Goods receipt processed successfully. Order status is now ${result.po.status}.`,
      data: populated,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// 2. List Goods Receipts
const list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.purchaseOrder) filter.purchaseOrder = req.query.purchaseOrder;
    if (req.query.warehouse) filter.warehouse = req.query.warehouse;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [total, receipts] = await Promise.all([
      GoodsReceipt.countDocuments(filter),
      GoodsReceipt.find(filter)
        .populate("purchaseOrder", "purchaseOrderNumber status totalAmount")
        .populate("warehouse", "warehouseName location")
        .populate("receivedBy", "name email")
        .populate("items.product", "productName sku")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      count: receipts.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      data: receipts,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Goods Receipt
const get = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Goods Receipt ID." });
    }

    const receipt = await GoodsReceipt.findById(req.params.id)
      .populate("purchaseOrder")
      .populate("warehouse")
      .populate("receivedBy", "name email")
      .populate("items.product");

    if (!receipt) {
      return res.status(404).json({ success: false, message: "Goods receipt not found." });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  get,
};
