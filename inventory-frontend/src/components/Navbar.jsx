import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { LogOut, ChevronRight, User, Shield } from "lucide-react";
import { logoutUser } from "../store/authSlice";

const pageTitleMap = {
    "/admin/dashboard": { module: "Administration", title: "Command Center" },
    "/admin/employees": { module: "Administration", title: "Workforce Directory" },
    "/admin/roles": { module: "Administration", title: "Roles & Permissions" },
    "/admin/settings": { module: "Administration", title: "Company Profile" },
    "/admin/config": { module: "Administration", title: "System Configuration" },
    "/admin/audit": { module: "Administration", title: "Security Audit Logs" },
    "/admin/reports": { module: "Administration", title: "Executive Reports" },

    "/purchase/dashboard": { module: "Procurement", title: "Purchase Command" },
    "/purchase/requests": { module: "Procurement", title: "Purchase Requests" },
    "/purchase/orders": { module: "Procurement", title: "Purchase Orders" },
    "/purchase/vendors": { module: "Procurement", title: "Suppliers & Vendors" },
    "/purchase/receipts": { module: "Procurement", title: "Goods Receipts (GRN)" },
    "/purchase/reports": { module: "Procurement", title: "Spend Analytics" },

    "/warehouse/dashboard": { module: "Warehouse", title: "WMS Hub" },
    "/warehouse/list": { module: "Warehouse", title: "Storage Facilities" },
    "/warehouse/inventory": { module: "Warehouse", title: "Bin Storage Inventory" },
    "/warehouse/transfers": { module: "Warehouse", title: "Inter-Warehouse Transfers" },
    "/warehouse/receiving": { module: "Warehouse", title: "Dock Inbound Receiving" },
    "/warehouse/audit": { module: "Warehouse", title: "Physical Stock Audit" },
    "/warehouse/damaged": { module: "Warehouse", title: "Damaged Stock Quarantine" },

    "/inventory/dashboard": { module: "Inventory", title: "Catalog Command" },
    "/inventory/products": { module: "Inventory", title: "Master Product Catalog" },
    "/inventory/categories": { module: "Inventory", title: "Product Categories" },
    "/inventory/brands": { module: "Inventory", title: "Brands & OEM" },
    "/inventory/variants": { module: "Inventory", title: "SKU Variants" },
    "/inventory/stock-in": { module: "Inventory", title: "Inbound Stock Intake" },
    "/inventory/stock-out": { module: "Inventory", title: "Outbound Picking" },
    "/inventory/barcodes": { module: "Inventory", title: "Barcode & SKU Tags" },
    "/inventory/adjustments": { module: "Inventory", title: "Stock Adjustments" },
    "/inventory/history": { module: "Inventory", title: "Movement Ledger History" },

    "/sales/dashboard": { module: "Sales", title: "Commercial Dashboard" },
    "/sales/orders": { module: "Sales", title: "Commercial Sales Orders" },
    "/sales/availability": { module: "Sales", title: "Stock Availability (ATP)" },
    "/sales/invoices": { module: "Sales", title: "Invoices & Billing" },
    "/sales/returns": { module: "Sales", title: "Customer Returns (RMA)" },
    "/sales/reports": { module: "Sales", title: "Sales Revenue Reports" },

    "/delivery/dashboard": { module: "Logistics", title: "Delivery Fleet Hub" },
    "/delivery/assigned": { module: "Logistics", title: "Assigned Delivery Dispatches" },
    "/delivery/tracking": { module: "Logistics", title: "Live Fleet GPS Tracking" },
    "/delivery/history": { module: "Logistics", title: "Delivery History & e-POD" },
};

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    const currentNav = pageTitleMap[location.pathname] || {
        module: "ERP",
        title: "Enterprise Workspace",
    };

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate("/login", { replace: true, state: {} });
    };

    return (
        <header className="erp-navbar">
            <div className="navbar-left">
                {/* Live Breadcrumb */}
                <div className="navbar-breadcrumb">
                    <span className="navbar-breadcrumb-crumb">InventoryPro</span>
                    <ChevronRight size={14} className="navbar-breadcrumb-sep" />
                    <span className="navbar-breadcrumb-crumb">{currentNav.module}</span>
                    <ChevronRight size={14} className="navbar-breadcrumb-sep" />
                    <span className="navbar-breadcrumb-active">{currentNav.title}</span>
                </div>
            </div>

            <div className="navbar-right">
                <span className="navbar-dept-badge">
                    Department:
                    <span className="navbar-dept-tag">{user?.department || "General ERP"}</span>
                </span>

                <div className="navbar-user-info">
                    <div className="navbar-user-name">{user?.name || "Authenticated User"}</div>
                    <div className="navbar-user-email">{user?.email || ""}</div>
                </div>

                <button
                    onClick={handleLogout}
                    className="navbar-logout-btn"
                    title="Sign out of system"
                >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                </button>
            </div>
        </header>
    );
};

export default Navbar;
