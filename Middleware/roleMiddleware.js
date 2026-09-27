const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  PURCHASE_MANAGER: "PURCHASE_MANAGER",
  WAREHOUSE_MANAGER: "WAREHOUSE_MANAGER",
  SALES_MANAGER: "SALES_MANAGER",
};

const ALLOWED_LOGIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.PURCHASE_MANAGER,
  ROLES.WAREHOUSE_MANAGER,
  ROLES.SALES_MANAGER,
];

const normalizeRole = (str) => {
  if (!str) return "";
  const cleaned = str
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "_");

  if (
    cleaned === "SUPER_ADMIN" ||
    cleaned === "SUPERADMIN" ||
    cleaned === "ADMIN"
  ) {
    return ROLES.SUPER_ADMIN;
  }
  if (cleaned === "PURCHASE_MANAGER" || cleaned === "PURCHASE") {
    return ROLES.PURCHASE_MANAGER;
  }
  if (cleaned === "WAREHOUSE_MANAGER" || cleaned === "WAREHOUSE") {
    return ROLES.WAREHOUSE_MANAGER;
  }
  if (cleaned === "SALES_MANAGER" || cleaned === "SALES") {
    return ROLES.SALES_MANAGER;
  }

  return cleaned;
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !req.user.roleName) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }

  const userRole = normalizeRole(req.user.roleName);

  // Super Admin has full bypass access
  if (userRole === ROLES.SUPER_ADMIN) {
    return next();
  }

  if (roles.length > 0) {
    const normalizedAllowed = roles.map(normalizeRole);
    const isAllowed = normalizedAllowed.includes(userRole);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied for role '${req.user.roleName}'.`,
      });
    }
  }

  next();
};

authorize.ROLES = ROLES;
authorize.ALLOWED_LOGIN_ROLES = ALLOWED_LOGIN_ROLES;
authorize.normalizeRole = normalizeRole;

module.exports = authorize;
module.exports.ROLES = ROLES;
module.exports.ALLOWED_LOGIN_ROLES = ALLOWED_LOGIN_ROLES;
module.exports.normalizeRole = normalizeRole;
module.exports.authorize = authorize;
