const StockTransfer = require("../Models/StockTransfer");
const Inventory = require("../Models/Inventory");
const StockMovement = require("../Models/StockMovement");
const Warehouse = require("../Models/Warehouse");
const Product = require("../Models/Product");
const { runInTransaction } = require("../Utils/dbTransactions");
const { logAudit } = require("../Utils/auditLogger");

const create = async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.sourceWarehouse || !b.destinationWarehouse || !b.items?.length) {
      return res.status(400).json({
        success: false,
        message: "sourceWarehouse, destinationWarehouse and items are required",
      });
    }

    if (String(b.sourceWarehouse) === String(b.destinationWarehouse)) {
      return res.status(400).json({
        success: false,
        message: "Source and destination warehouses must differ",
      });
    }

    const [srcWh, dstWh] = await Promise.all([
      Warehouse.findById(b.sourceWarehouse),
      Warehouse.findById(b.destinationWarehouse),
    ]);

    if (!srcWh || !dstWh) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    if (srcWh.status === "INACTIVE" || dstWh.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Cannot create transfer involving an INACTIVE warehouse",
      });
    }

    for (const i of b.items) {
      const p = await Product.findById(i.product);
      if (!p) {
        return res.status(404).json({ success: false, message: `Product ${i.product} not found` });
      }
      if (!i.quantity || i.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than zero",
        });
      }
    }

    const d = await StockTransfer.create({
      sourceWarehouse: b.sourceWarehouse,
      destinationWarehouse: b.destinationWarehouse,
      requestedBy: req.user?.id,
      items: b.items,
      status: "REQUESTED",
    });

    await logAudit({
      employeeId: req.user?.id,
      action: "STOCK_TRANSFER_REQUESTED",
      entityType: "STOCK_TRANSFER",
      entityId: d._id,
      description: `Stock transfer requested from ${srcWh.warehouseName} to ${dstWh.warehouseName}`,
      newData: d.toObject(),
      ipAddress: req.ip,
    });

    const populated = await StockTransfer.findById(d._id)
      .populate("sourceWarehouse destinationWarehouse requestedBy approvedBy")
      .populate("items.product", "productName sku");

    res.status(201).json({ success: true, data: populated });
  } catch (e) {
    next(e);
  }
};

const list = async (req, res, next) => {
  try {
    const d = await StockTransfer.find(req.query)
      .populate("sourceWarehouse destinationWarehouse requestedBy approvedBy")
      .populate("items.product", "productName sku")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    const d = await StockTransfer.findById(req.params.id)
      .populate("sourceWarehouse destinationWarehouse requestedBy approvedBy")
      .populate("items.product");
    if (!d) return res.status(404).json({ success: false, message: "Transfer not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};

const approve = async (req, res, next) => {
  try {
    const d = await StockTransfer.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Transfer not found" });
    if (d.status !== "REQUESTED") {
      return res.status(400).json({
        success: false,
        message: "Only requested transfers can be approved",
      });
    }

    for (const i of d.items) {
      const inv = await Inventory.findOne({
        product: i.product,
        warehouse: d.sourceWarehouse,
      });
      const available = inv ? inv.quantity - (inv.reservedStock || 0) : 0;
      if (available < i.quantity) {
        return res.status(409).json({
          success: false,
          message: `Insufficient source stock for product ${i.product}. Available: ${available}, required: ${i.quantity}`,
        });
      }
    }

    d.status = "APPROVED";
    d.approvedBy = req.user?.id;
    await d.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "STOCK_TRANSFER_APPROVED",
      entityType: "STOCK_TRANSFER",
      entityId: d._id,
      description: `Stock transfer ${d._id} approved`,
      newData: d.toObject(),
      ipAddress: req.ip,
    });

    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};

const dispatch = async (req, res, next) => {
  try {
    const d = await StockTransfer.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Transfer not found" });
    if (d.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Only approved transfers can be dispatched",
      });
    }
    d.status = "IN_TRANSIT";
    await d.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "STOCK_TRANSFER_DISPATCHED",
      entityType: "STOCK_TRANSFER",
      entityId: d._id,
      description: `Stock transfer ${d._id} dispatched (IN_TRANSIT)`,
      newData: d.toObject(),
      ipAddress: req.ip,
    });

    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};

const complete = async (req, res, next) => {
  try {
    const d = await StockTransfer.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Transfer not found" });
    if (!["APPROVED", "IN_TRANSIT"].includes(d.status)) {
      return res.status(400).json({
        success: false,
        message: "Transfer is not ready for completion (must be APPROVED or IN_TRANSIT)",
      });
    }

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};

      for (const i of d.items) {
        let srcQuery = Inventory.findOne({
          product: i.product,
          warehouse: d.sourceWarehouse,
        });
        if (session) srcQuery = srcQuery.session(session);
        const src = await srcQuery;

        const available = src ? src.quantity - (src.reservedStock || 0) : 0;
        if (!src || available < i.quantity) {
          const err = new Error(`Insufficient source stock for product ${i.product}. Available: ${available}, required: ${i.quantity}`);
          err.statusCode = 409;
          throw err;
        }

        const srcPrev = src.quantity;
        src.quantity -= i.quantity;
        await src.save(opts);

        let dstQuery = Inventory.findOne({
          product: i.product,
          warehouse: d.destinationWarehouse,
        });
        if (session) dstQuery = dstQuery.session(session);
        let dst = await dstQuery;

        if (!dst) {
          if (session) {
            const created = await Inventory.create(
              [{ product: i.product, warehouse: d.destinationWarehouse, quantity: 0, reservedStock: 0 }],
              { session }
            );
            dst = created[0];
          } else {
            dst = await Inventory.create({
              product: i.product,
              warehouse: d.destinationWarehouse,
              quantity: 0,
              reservedStock: 0,
            });
          }
        }

        const dstPrev = dst.quantity;
        dst.quantity += i.quantity;
        await dst.save(opts);

        const moveOutData = {
          product: i.product,
          warehouse: d.sourceWarehouse,
          type: "TRANSFER_OUT",
          quantity: i.quantity,
          referenceType: "TRANSFER",
          referenceId: d._id,
          previousQuantity: srcPrev,
          newQuantity: src.quantity,
          performedBy: req.user?.id,
        };

        const moveInData = {
          product: i.product,
          warehouse: d.destinationWarehouse,
          type: "TRANSFER_IN",
          quantity: i.quantity,
          referenceType: "TRANSFER",
          referenceId: d._id,
          previousQuantity: dstPrev,
          newQuantity: dst.quantity,
          performedBy: req.user?.id,
        };

        if (session) {
          await StockMovement.create([moveOutData], { session });
          await StockMovement.create([moveInData], { session });
        } else {
          await StockMovement.create(moveOutData);
          await StockMovement.create(moveInData);
        }

        i.receivedQuantity = i.quantity;
      }

      d.status = "COMPLETED";
      d.completedAt = new Date();
      await d.save(opts);

      await logAudit({
        employeeId: req.user?.id,
        action: "STOCK_TRANSFER_COMPLETED",
        entityType: "STOCK_TRANSFER",
        entityId: d._id,
        description: `Stock transfer ${d._id} completed`,
        newData: d.toObject(),
        ipAddress: req.ip,
      });
    });

    const populated = await StockTransfer.findById(d._id)
      .populate("sourceWarehouse destinationWarehouse requestedBy approvedBy")
      .populate("items.product");

    res.json({ success: true, message: "Transfer completed successfully", data: populated });
  } catch (e) {
    if (e.statusCode) {
      return res.status(e.statusCode).json({ success: false, message: e.message });
    }
    next(e);
  }
};

module.exports = { create, list, get, approve, dispatch, complete };
