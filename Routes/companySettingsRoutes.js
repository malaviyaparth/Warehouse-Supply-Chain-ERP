const router = require("express").Router();
const c = require("../Controllers/companySettingsController");
const authorize = require("../Middleware/roleMiddleware");
const checkPermission = require("../Middleware/permissionMiddleware");
const { ROLES } = authorize;

// Company and System settings: Super Admin only
router.use(authorize(ROLES.SUPER_ADMIN));

router.get("/", checkPermission("settings.manage"), c.getSettings);
router.put("/", checkPermission("settings.manage"), c.updateCompanyProfile);
router.get("/config", checkPermission("settings.manage"), async (req, res, next) => {
  try {
    const CompanySettings = require("../Models/CompanySettings");
    let settings = await CompanySettings.findOne();
    if (!settings) {
      return c.getSettings(req, res, next);
    }
    res.json({ success: true, data: settings.systemConfig });
  } catch (e) {
    next(e);
  }
});
router.put("/config", checkPermission("settings.manage"), c.updateSystemConfig);

// Trigger automation scans on demand (Super Admin only)
router.post("/trigger-low-stock-scan", async (req, res, next) => {
  try {
    const { runLowStockScan } = require("../jobs/inventoryJobs");
    const result = await runLowStockScan();
    res.json({ success: true, message: "Low stock scan executed successfully", data: result });
  } catch (e) {
    next(e);
  }
});

router.post("/trigger-overdue-scan", async (req, res, next) => {
  try {
    const { runOverduePurchaseScan } = require("../jobs/inventoryJobs");
    const result = await runOverduePurchaseScan();
    res.json({ success: true, message: "Overdue PO scan executed successfully", data: result });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

