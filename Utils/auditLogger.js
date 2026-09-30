const AuditLog = require("../Models/AuditLog");

const SENSITIVE_KEYS = new Set([
  "password",
  "passwords",
  "currentpassword",
  "newpassword",
  "token",
  "refreshtoken",
  "accesstoken",
  "jwt",
  "secret",
  "apisecret",
  "apikey",
  "authorization",
]);

const deepSanitize = (val) => {
  if (!val || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(deepSanitize);

  const clean = {};
  for (const [k, v] of Object.entries(val)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      continue; // omit sensitive data completely
    }
    clean[k] = typeof v === "object" && v !== null ? deepSanitize(v) : v;
  }
  return clean;
};

/**
 * Record an audit log entry safely without interrupting the calling workflow.
 */
const logAudit = async ({
  employeeId,
  action,
  entityType,
  entityId = null,
  description = "",
  oldData = null,
  newData = null,
  ipAddress = "",
}) => {
  try {
    if (!employeeId || !action || !entityType) {
      return null;
    }

    return await AuditLog.create({
      employee: employeeId,
      action: action.toUpperCase(),
      entityType: entityType.toUpperCase(),
      entityId,
      description,
      oldData: deepSanitize(oldData),
      newData: deepSanitize(newData),
      ipAddress,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Failed to record audit log:", err.message);
    return null;
  }
};

module.exports = { logAudit };

