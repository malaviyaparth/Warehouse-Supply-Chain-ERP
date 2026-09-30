import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Settings,
    Sliders,
    FileText,
    BarChart3,
    Building2,
    Boxes,
    ArrowLeftRight,
    ClipboardCheck,
    AlertTriangle,
    Tag,
    Barcode,
    History,
    SlidersHorizontal,
    Layers,
    Truck,
    MapPin,
    PackageCheck,
    Receipt,
    RotateCcw,
    Package,
    Warehouse,
    ShoppingCart
} from "lucide-react";
import { normalizeRole, getRoleDisplayName, ROLES } from "../utils/roles";

const moduleDefinitions = {
    ADMIN: {
        title: "Administration",
        defaultRoute: "/admin/dashboard",
        links: [
            { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
            { label: "Employees", path: "/admin/employees", icon: Users },
            { label: "Roles & Permissions", path: "/admin/roles", icon: ShieldCheck },
            { label: "Company Settings", path: "/admin/settings", icon: Settings },
            { label: "System Config", path: "/admin/config", icon: Sliders },
            { label: "Audit Logs", path: "/admin/audit", icon: FileText },
            { label: "Global Reports", path: "/admin/reports", icon: BarChart3 },
        ],
    },
    PURCHASE: {
        title: "Procurement",
        defaultRoute: "/purchase/dashboard",
        links: [
            { label: "Purchase Dashboard", path: "/purchase/dashboard", icon: LayoutDashboard },
            { label: "Purchase Requests", path: "/purchase/requests", icon: ShoppingCart },
            { label: "Purchase Orders", path: "/purchase/orders", icon: FileText },
            { label: "Vendors & Suppliers", path: "/purchase/vendors", icon: Building2 },
            { label: "Goods Receipts (GRN)", path: "/purchase/receipts", icon: PackageCheck },
            { label: "Procurement Reports", path: "/purchase/reports", icon: BarChart3 },
        ],
    },
    WAREHOUSE: {
        title: "Warehouse & WMS",
        defaultRoute: "/warehouse/dashboard",
        links: [
            { label: "Warehouse Dashboard", path: "/warehouse/dashboard", icon: LayoutDashboard },
            { label: "Storage Facilities", path: "/warehouse/list", icon: Warehouse },
            { label: "Bin Storage Inventory", path: "/warehouse/inventory", icon: Boxes },
            { label: "Stock Transfers", path: "/warehouse/transfers", icon: ArrowLeftRight },
            { label: "Dock Goods Receiving", path: "/warehouse/receiving", icon: PackageCheck },
            { label: "Physical Stock Audit", path: "/warehouse/audit", icon: ClipboardCheck },
            { label: "Damaged Stock Quarantine", path: "/warehouse/damaged", icon: AlertTriangle },
        ],
    },
    INVENTORY: {
        title: "Inventory & Catalog",
        defaultRoute: "/inventory/dashboard",
        links: [
            { label: "Inventory Dashboard", path: "/inventory/dashboard", icon: LayoutDashboard },
            { label: "Master Product Catalog", path: "/inventory/products", icon: Package },
            { label: "Product Categories", path: "/inventory/categories", icon: Tag },
            { label: "Brands & OEM", path: "/inventory/brands", icon: Layers },
            { label: "SKU Variants", path: "/inventory/variants", icon: SlidersHorizontal },
            { label: "Inbound Stock Intake", path: "/inventory/stock-in", icon: PackageCheck },
            { label: "Outbound Picking", path: "/inventory/stock-out", icon: ArrowLeftRight },
            { label: "Barcode & SKU Tags", path: "/inventory/barcodes", icon: Barcode },
            { label: "Stock Adjustments", path: "/inventory/adjustments", icon: Sliders },
            { label: "Movement Ledger History", path: "/inventory/history", icon: History },
        ],
    },
    SALES: {
        title: "Sales & Billing",
        defaultRoute: "/sales/dashboard",
        links: [
            { label: "Sales Dashboard", path: "/sales/dashboard", icon: LayoutDashboard },
            { label: "Commercial Sales Orders", path: "/sales/orders", icon: ShoppingCart },
            { label: "Stock Availability (ATP)", path: "/sales/availability", icon: Boxes },
            { label: "Invoices & Billing", path: "/sales/invoices", icon: Receipt },
            { label: "RMA Customer Returns", path: "/sales/returns", icon: RotateCcw },
            { label: "Sales Revenue Reports", path: "/sales/reports", icon: BarChart3 },
        ],
    },
    DELIVERY: {
        title: "Logistics & Fleet",
        defaultRoute: "/delivery/dashboard",
        links: [
            { label: "Delivery Dashboard", path: "/delivery/dashboard", icon: LayoutDashboard },
            { label: "Assigned Dispatches", path: "/delivery/assigned", icon: Truck },
            { label: "Live Fleet GPS Tracking", path: "/delivery/tracking", icon: MapPin },
            { label: "Delivery History & e-POD", path: "/delivery/history", icon: History },
        ],
    },
};

const getModuleFromPath = (pathname) => {
    if (pathname.startsWith("/admin")) return "ADMIN";
    if (pathname.startsWith("/purchase")) return "PURCHASE";
    if (pathname.startsWith("/warehouse")) return "WAREHOUSE";
    if (pathname.startsWith("/inventory")) return "INVENTORY";
    if (pathname.startsWith("/sales")) return "SALES";
    if (pathname.startsWith("/delivery")) return "DELIVERY";
    return "ADMIN";
};

const getDefaultModuleForRole = (normalizedRole) => {
    switch (normalizedRole) {
        case ROLES.SUPER_ADMIN:
            return "ADMIN";
        case ROLES.PURCHASE_MANAGER:
            return "PURCHASE";
        case ROLES.WAREHOUSE_MANAGER:
            return "WAREHOUSE";
        case ROLES.SALES_MANAGER:
            return "SALES";
        default:
            return "ADMIN";
    }
};

const getAllowedModulesForRole = (normalizedRole) => {
    switch (normalizedRole) {
        case ROLES.SUPER_ADMIN:
            return ["ADMIN", "PURCHASE", "WAREHOUSE", "INVENTORY", "SALES", "DELIVERY"];
        case ROLES.PURCHASE_MANAGER:
            return ["PURCHASE"];
        case ROLES.WAREHOUSE_MANAGER:
            return ["WAREHOUSE", "INVENTORY"];
        case ROLES.SALES_MANAGER:
            return ["SALES", "DELIVERY"];
        default:
            return ["ADMIN"];
    }
};

const Sidebar = () => {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();
    const navigate = useNavigate();

    const normalizedRole = normalizeRole(user?.role);
    const roleTitle = getRoleDisplayName(user?.role);
    const isSuperAdmin = normalizedRole === ROLES.SUPER_ADMIN;
    const allowedModules = getAllowedModulesForRole(normalizedRole);

    // Detect active module based on current URL path
    const activeModuleFromPath = getModuleFromPath(location.pathname);
    const initialModule = allowedModules.includes(activeModuleFromPath)
        ? activeModuleFromPath
        : getDefaultModuleForRole(normalizedRole);

    const [selectedModule, setSelectedModule] = useState(initialModule);

    // Keep active module in sync when user navigates
    useEffect(() => {
        const mod = getModuleFromPath(location.pathname);
        if (allowedModules.includes(mod)) {
            setSelectedModule(mod);
        }
    }, [location.pathname, allowedModules]);

    const handleModuleChange = (e) => {
        const nextMod = e.target.value;
        setSelectedModule(nextMod);
        const targetRoute = moduleDefinitions[nextMod]?.defaultRoute;
        if (targetRoute) {
            navigate(targetRoute);
        }
    };

    const currentModule = moduleDefinitions[selectedModule] || moduleDefinitions.ADMIN;
    const links = currentModule.links || [];

    return (
        <aside className="erp-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-brand-icon">
                    <Boxes size={20} />
                </div>
                <div>
                    <div className="sidebar-brand-text">INVENTORY PRO</div>
                    <div className="sidebar-brand-sub">Supply Chain ERP</div>
                </div>
            </div>

            <div className="sidebar-role-panel">
                <div className="sidebar-role-label">Authenticated Role</div>
                <div className="sidebar-role-badge">
                    {roleTitle}
                </div>
            </div>

            {/* Subsystem Switcher for authorized roles with multiple modules */}
            {allowedModules.length > 1 && (
                <div className="sidebar-module-selector">
                    <label>Active ERP Subsystem</label>
                    <select
                        className="sidebar-module-select"
                        value={selectedModule}
                        onChange={handleModuleChange}
                    >
                        {allowedModules.includes("ADMIN") && <option value="ADMIN">👑 Administration (7)</option>}
                        {allowedModules.includes("PURCHASE") && <option value="PURCHASE">🛒 Procurement & POs (6)</option>}
                        {allowedModules.includes("WAREHOUSE") && <option value="WAREHOUSE">🏭 Warehouse & WMS (7)</option>}
                        {allowedModules.includes("INVENTORY") && <option value="INVENTORY">📦 Inventory & Catalog (10)</option>}
                        {allowedModules.includes("SALES") && <option value="SALES">💼 Commercial Sales (6)</option>}
                        {allowedModules.includes("DELIVERY") && <option value="DELIVERY">🚚 Logistics Fleet (4)</option>}
                    </select>
                </div>
            )}

            <nav className="sidebar-nav">
                <div style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    color: "var(--color-slate-400)",
                    padding: "4px 8px 8px",
                }}>
                    {currentModule.title} Navigation
                </div>

                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "active" : ""}`
                            }
                        >
                            {Icon && <Icon size={17} />}
                            <span>{link.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
