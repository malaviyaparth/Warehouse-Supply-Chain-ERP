const { normalizeRole, ROLES } = require("./roleMiddleware");

/**
 * Middleware to enforce granular permissions.
 * Super Admin automatically bypasses all permission restrictions.
 *
 * @param {...string} requiredPermissions - One or more required permission keys.
 */
const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    // Super Admin bypasses individual permission checks
    const normalizedRole = normalizeRole(req.user.roleName || "");
    if (normalizedRole === ROLES.SUPER_ADMIN) {
      return next();
    }

    const userPermissions = (req.user.permissions || []).map((p) =>
      (typeof p === "string" ? p : p.permissionName || "").trim().toLowerCase()
    );

    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.includes(perm.trim().toLowerCase())
    );

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission(s): [${requiredPermissions.join(", ")}].`,
      });
    }

    next();
  };
};

module.exports = checkPermission;
