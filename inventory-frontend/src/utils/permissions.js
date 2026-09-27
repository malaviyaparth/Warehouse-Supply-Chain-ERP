/**
 * Granular RBAC Permission Evaluation Utilities
 */

const normalizeRole = (role) => (role ? String(role).trim().toUpperCase() : "");

export const hasPermission = (user, permission) => {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === "SUPER ADMIN" || role === "ADMIN") return true;

  const permissions = (user.permissions || []).map((p) =>
    (typeof p === "string" ? p : p.permissionName || "").trim().toLowerCase()
  );
  return permissions.includes(permission.trim().toLowerCase());
};

export const hasAnyPermission = (user, ...permissions) => {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === "SUPER ADMIN" || role === "ADMIN") return true;

  const userPerms = (user.permissions || []).map((p) =>
    (typeof p === "string" ? p : p.permissionName || "").trim().toLowerCase()
  );
  return permissions.some((perm) => userPerms.includes(perm.trim().toLowerCase()));
};

export const hasAllPermissions = (user, ...permissions) => {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === "SUPER ADMIN" || role === "ADMIN") return true;

  const userPerms = (user.permissions || []).map((p) =>
    (typeof p === "string" ? p : p.permissionName || "").trim().toLowerCase()
  );
  return permissions.every((perm) => userPerms.includes(perm.trim().toLowerCase()));
};
