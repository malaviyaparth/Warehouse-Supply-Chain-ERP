/**
 * Canonical 4-Role RBAC Structure for Inventory Management ERP:
 * 1. SUPER_ADMIN
 * 2. PURCHASE_MANAGER
 * 3. WAREHOUSE_MANAGER
 * 4. SALES_MANAGER
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  PURCHASE_MANAGER: "PURCHASE_MANAGER",
  WAREHOUSE_MANAGER: "WAREHOUSE_MANAGER",
  SALES_MANAGER: "SALES_MANAGER",
};

export const normalizeRole = (role) => {
  if (!role) return "";
  let roleStr = role;
  if (typeof role === "object") {
    roleStr = role.roleName || role.name || role.role || "";
  }
  if (typeof roleStr !== "string") return "";

  const cleaned = roleStr
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
  if (
    cleaned === "WAREHOUSE_MANAGER" ||
    cleaned === "WAREHOUSE" ||
    cleaned === "INVENTORY_STAFF" ||
    cleaned === "INVENTORY"
  ) {
    return ROLES.WAREHOUSE_MANAGER;
  }
  if (
    cleaned === "SALES_MANAGER" ||
    cleaned === "SALES" ||
    cleaned === "DELIVERY_STAFF" ||
    cleaned === "DELIVERY"
  ) {
    return ROLES.SALES_MANAGER;
  }

  return cleaned;
};

export const getRoleDisplayName = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case ROLES.SUPER_ADMIN:
      return "Super Admin";
    case ROLES.PURCHASE_MANAGER:
      return "Purchase Manager";
    case ROLES.WAREHOUSE_MANAGER:
      return "Warehouse Manager";
    case ROLES.SALES_MANAGER:
      return "Sales Manager";
    default:
      return typeof role === "string" ? role : "User";
  }
};

export const getDashboardRoute = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case ROLES.SUPER_ADMIN:
      return "/admin/dashboard";
    case ROLES.PURCHASE_MANAGER:
      return "/purchase/dashboard";
    case ROLES.WAREHOUSE_MANAGER:
      return "/warehouse/dashboard";
    case ROLES.SALES_MANAGER:
      return "/sales/dashboard";
    default:
      return "/login"; // Prevents unauthenticated / unknown roles from landing on protected admin page
  }
};

export const isAuthorizedForRole = (userRole, allowedRoles = []) => {
  const normUserRole = normalizeRole(userRole);
  if (!normUserRole) return false;

  // Super Admin can access all modules
  if (normUserRole === ROLES.SUPER_ADMIN) return true;

  if (!allowedRoles || allowedRoles.length === 0) return true;

  const normalizedAllowed = allowedRoles.map(normalizeRole);

  // Warehouse Manager has access to warehouse and inventory
  if (
    normUserRole === ROLES.WAREHOUSE_MANAGER &&
    (normalizedAllowed.includes(ROLES.WAREHOUSE_MANAGER) ||
      normalizedAllowed.includes("INVENTORY_STAFF") ||
      normalizedAllowed.includes("INVENTORY"))
  ) {
    return true;
  }

  // Sales Manager has access to sales and delivery
  if (
    normUserRole === ROLES.SALES_MANAGER &&
    (normalizedAllowed.includes(ROLES.SALES_MANAGER) ||
      normalizedAllowed.includes("DELIVERY_STAFF") ||
      normalizedAllowed.includes("DELIVERY"))
  ) {
    return true;
  }

  return normalizedAllowed.includes(normUserRole);
};

export const isPathAuthorizedForRole = (pathname, role) => {
  if (!pathname || typeof pathname !== "string") return false;
  const norm = normalizeRole(role);
  if (!norm) return false;

  // Reject auth, forbidden, and root pages as redirect targets
  if (["/login", "/register", "/unauthorized", "/forgot-password", "/"].includes(pathname)) {
    return false;
  }

  // Neutral authenticated route
  if (pathname === "/dashboard") return true;

  // Super Admin can access all pages
  if (norm === ROLES.SUPER_ADMIN) return true;

  if (norm === ROLES.PURCHASE_MANAGER) {
    return pathname.startsWith("/purchase");
  }
  if (norm === ROLES.WAREHOUSE_MANAGER) {
    return pathname.startsWith("/warehouse") || pathname.startsWith("/inventory");
  }
  if (norm === ROLES.SALES_MANAGER) {
    return pathname.startsWith("/sales") || pathname.startsWith("/delivery");
  }

  return false;
};
