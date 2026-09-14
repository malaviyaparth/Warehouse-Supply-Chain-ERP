const mongoose = require("mongoose");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const createCrudController = (Model, options = {}) => {
  const populate = options.populate || [];
  const makeQuery = () => {
    let q = Model.find();
    populate.forEach((p) => (q = q.populate(p)));
    return q.sort({ createdAt: -1 });
  };
  return {
    create: async (req, res, next) => {
      try {
        const doc = await Model.create(req.body);
        res.status(201).json({ success: true, data: doc });
      } catch (e) {
        next(e);
      }
    },
    list: async (req, res, next) => {
      try {
        const docs = await makeQuery();
        res.json({ success: true, count: docs.length, data: docs });
      } catch (e) {
        next(e);
      }
    },
    get: async (req, res, next) => {
      try {
        if (!validId(req.params.id))
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        let q = Model.findById(req.params.id);
        populate.forEach((p) => (q = q.populate(p)));
        const doc = await q;
        if (!doc)
          return res
            .status(404)
            .json({ success: false, message: "Record not found" });
        res.json({ success: true, data: doc });
      } catch (e) {
        next(e);
      }
    },
    update: async (req, res, next) => {
      try {
        if (!validId(req.params.id))
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        let q = Model.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });
        populate.forEach((p) => (q = q.populate(p)));
        const doc = await q;
        if (!doc)
          return res
            .status(404)
            .json({ success: false, message: "Record not found" });
        res.json({ success: true, data: doc });
      } catch (e) {
        next(e);
      }
    },
    remove: async (req, res, next) => {
      try {
        if (!validId(req.params.id))
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc)
          return res
            .status(404)
            .json({ success: false, message: "Record not found" });
        res.json({ success: true, message: "Deleted successfully" });
      } catch (e) {
        next(e);
      }
    },
  };
};
module.exports = { createCrudController, validId };
