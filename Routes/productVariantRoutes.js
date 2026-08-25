const express = require("express");
const router = express.Router();

const {
  createVariant,
  getVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
} = require("../Controllers/productVariantController");

router.post("/", createVariant);
router.get("/product/:productId", getVariants);
router.get("/:id", getVariantById);
router.put("/:id", updateVariant);
router.delete("/:id", deleteVariant);

module.exports = router;