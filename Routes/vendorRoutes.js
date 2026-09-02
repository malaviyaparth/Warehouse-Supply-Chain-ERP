const express = require("express");

const {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor
} = require("../Controllers/vendorController");

const router = express.Router();

router.post("/", createVendor);
router.get("/", getVendors);
router.get("/:id", getVendorById);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

module.exports = router;