const CompanySettings = require("../Models/CompanySettings");
const { logAudit } = require("../Utils/auditLogger");

// Get settings (creates default singleton if none exists)
const getSettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: "InventoryPro Global Logistics",
        companyEmail: "contact@inventorypro.com",
        companyPhone: "+1 (800) 555-0199",
        companyAddress: "742 Evergreen Terrace, Logistics Hub, IL 62704",
        taxNumber: "US-EIN-9923841",
        currency: "USD",
        timezone: "UTC",
        systemConfig: {
          defaultReorderThreshold: 15,
          lowStockAlertEnabled: true,
          defaultTaxRate: 8.5,
          invoicePrefix: "INV-",
          poPrefix: "PO-",
          soPrefix: "SO-",
          notificationEmail: "alerts@inventorypro.com",
          enableEmailAlerts: false,
        },
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// Update company profile settings
const updateCompanyProfile = async (req, res, next) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      taxNumber,
      currency,
      timezone,
    } = req.body;

    let settings = await CompanySettings.findOne();
    const oldSettings = settings ? settings.toObject() : {};

    if (!settings) {
      settings = new CompanySettings();
    }

    if (companyName !== undefined) settings.companyName = companyName;
    if (companyEmail !== undefined) settings.companyEmail = companyEmail;
    if (companyPhone !== undefined) settings.companyPhone = companyPhone;
    if (companyAddress !== undefined) settings.companyAddress = companyAddress;
    if (taxNumber !== undefined) settings.taxNumber = taxNumber;
    if (currency !== undefined) settings.currency = currency;
    if (timezone !== undefined) settings.timezone = timezone;
    settings.updatedBy = req.user?.id;

    await settings.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "COMPANY_SETTINGS_UPDATED",
      entityType: "SETTINGS",
      entityId: settings._id,
      description: "Company profile details updated",
      oldData: oldSettings,
      newData: settings.toObject(),
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Company profile updated.", data: settings });
  } catch (error) {
    next(error);
  }
};

// Update system configuration
const updateSystemConfig = async (req, res, next) => {
  try {
    const configUpdate = req.body;
    let settings = await CompanySettings.findOne();

    if (!settings) {
      settings = new CompanySettings();
    }

    settings.systemConfig = {
      ...settings.systemConfig.toObject(),
      ...configUpdate,
    };
    settings.updatedBy = req.user?.id;

    await settings.save();

    await logAudit({
      employeeId: req.user?.id,
      action: "SYSTEM_CONFIG_UPDATED",
      entityType: "CONFIG",
      entityId: settings._id,
      description: "System parameters updated",
      newData: settings.systemConfig,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "System configuration updated.",
      data: settings.systemConfig,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateCompanyProfile,
  updateSystemConfig,
};
