const Invoice = require("../Models/Invoice");
const list = async (req, res, next) => {
  try {
    const d = await Invoice.find(req.query)
      .populate("salesOrder")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: d.length, data: d });
  } catch (e) {
    next(e);
  }
};
const get = async (req, res, next) => {
  try {
    const d = await Invoice.findById(req.params.id).populate("salesOrder");
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
const updatePayment = async (req, res, next) => {
  try {
    const b = req.body;
    const d = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        paidAt: b.paymentStatus === "PAID" ? new Date() : undefined,
      },
      { new: true, runValidators: true },
    );
    if (!d)
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};
module.exports = { list, get, updatePayment };
