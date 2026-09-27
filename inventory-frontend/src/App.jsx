import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import { getDashboardRoute, ROLES } from "./utils/roles";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// 1. Super Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeesPage from "./pages/admin/EmployeesPage";
import RolesPermissionsPage from "./pages/admin/RolesPermissionsPage";
import CompanySettingsPage from "./pages/admin/CompanySettingsPage";
import SystemConfigPage from "./pages/admin/SystemConfigPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import ReportsPage from "./pages/admin/ReportsPage";

// 2. Purchase Manager Pages
import PurchaseDashboard from "./pages/purchase/PurchaseDashboard";
import PurchaseRequestsPage from "./pages/purchase/PurchaseRequestsPage";
import PurchaseOrdersPage from "./pages/purchase/PurchaseOrdersPage";
import VendorsPage from "./pages/purchase/VendorsPage";
import GoodsReceiptsPage from "./pages/purchase/GoodsReceiptsPage";
import PurchaseReportsPage from "./pages/purchase/PurchaseReportsPage";

// 3. Warehouse Manager Pages
import WarehouseDashboard from "./pages/warehouse/WarehouseDashboard";
import WarehousesPage from "./pages/warehouse/WarehousesPage";
import WarehouseInventoryPage from "./pages/warehouse/WarehouseInventoryPage";
import StockTransfersPage from "./pages/warehouse/StockTransfersPage";
import GoodsReceivingPage from "./pages/warehouse/GoodsReceivingPage";
import StockAuditPage from "./pages/warehouse/StockAuditPage";
import DamagedStockPage from "./pages/warehouse/DamagedStockPage";

// 4. Inventory Staff Pages
import InventoryDashboard from "./pages/inventory/InventoryDashboard";
import ProductsPage from "./pages/inventory/ProductsPage";
import CategoriesPage from "./pages/inventory/CategoriesPage";
import BrandsPage from "./pages/inventory/BrandsPage";
import ProductVariantsPage from "./pages/inventory/ProductVariantsPage";
import StockInPage from "./pages/inventory/StockInPage";
import StockOutPage from "./pages/inventory/StockOutPage";
import BarcodeManagementPage from "./pages/inventory/BarcodeManagementPage";
import StockAdjustmentPage from "./pages/inventory/StockAdjustmentPage";
import InventoryHistoryPage from "./pages/inventory/InventoryHistoryPage";

// 5. Sales Manager Pages
import SalesDashboard from "./pages/sales/SalesDashboard";
import SalesOrdersPage from "./pages/sales/SalesOrdersPage";
import InventoryAvailabilityPage from "./pages/sales/InventoryAvailabilityPage";
import InvoicesPage from "./pages/sales/InvoicesPage";
import ReturnsPage from "./pages/sales/ReturnsPage";
import SalesReportsPage from "./pages/sales/SalesReportsPage";

// 6. Delivery Staff Pages
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import AssignedDeliveriesPage from "./pages/delivery/AssignedDeliveriesPage";
import DeliveryTrackingPage from "./pages/delivery/DeliveryTrackingPage";
import DeliveryHistoryPage from "./pages/delivery/DeliveryHistoryPage";

// Dashboard Redirect based on user role
const DashboardRedirect = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  const target = getDashboardRoute(user?.role);
  if (!target || target === "/login") {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={target} replace />;
};

const Unauthorized = () => {
  const { user } = useSelector((state) => state.auth);
  const targetDashboard = user ? getDashboardRoute(user?.role) : "/login";

  return (
    <div className="forbidden-container">
      <div className="forbidden-card">
        <div className="forbidden-code">403</div>
        <h2>Access Forbidden</h2>
        <p>Your current user role lacks authorization to access this ERP module.</p>
        <Link to={targetDashboard} className="btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Authorized Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Authenticated ERP Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Super Admin Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.SUPER_ADMIN, "Super Admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<EmployeesPage />} />
            <Route path="/admin/roles" element={<RolesPermissionsPage />} />
            <Route path="/admin/settings" element={<CompanySettingsPage />} />
            <Route path="/admin/config" element={<SystemConfigPage />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>

          {/* Purchase Manager Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.PURCHASE_MANAGER, "Purchase Manager"]} />}>
            <Route path="/purchase/dashboard" element={<PurchaseDashboard />} />
            <Route path="/purchase/requests" element={<PurchaseRequestsPage />} />
            <Route path="/purchase/orders" element={<PurchaseOrdersPage />} />
            <Route path="/purchase/vendors" element={<VendorsPage />} />
            <Route path="/purchase/receipts" element={<GoodsReceiptsPage />} />
            <Route path="/purchase/reports" element={<PurchaseReportsPage />} />
          </Route>

          {/* Warehouse Manager Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.WAREHOUSE_MANAGER, "Warehouse Manager"]} />}>
            <Route path="/warehouse/dashboard" element={<WarehouseDashboard />} />
            <Route path="/warehouse/list" element={<WarehousesPage />} />
            <Route path="/warehouse/inventory" element={<WarehouseInventoryPage />} />
            <Route path="/warehouse/transfers" element={<StockTransfersPage />} />
            <Route path="/warehouse/receiving" element={<GoodsReceivingPage />} />
            <Route path="/warehouse/audit" element={<StockAuditPage />} />
            <Route path="/warehouse/damaged" element={<DamagedStockPage />} />
          </Route>

          {/* Warehouse & Physical Stock Operations (Warehouse Manager) */}
          <Route element={<RoleRoute allowedRoles={[ROLES.WAREHOUSE_MANAGER]} />}>
            <Route path="/inventory/dashboard" element={<InventoryDashboard />} />
            <Route path="/inventory/products" element={<ProductsPage />} />
            <Route path="/inventory/categories" element={<CategoriesPage />} />
            <Route path="/inventory/brands" element={<BrandsPage />} />
            <Route path="/inventory/variants" element={<ProductVariantsPage />} />
            <Route path="/inventory/stock-in" element={<StockInPage />} />
            <Route path="/inventory/stock-out" element={<StockOutPage />} />
            <Route path="/inventory/barcodes" element={<BarcodeManagementPage />} />
            <Route path="/inventory/adjustments" element={<StockAdjustmentPage />} />
            <Route path="/inventory/history" element={<InventoryHistoryPage />} />
          </Route>

          {/* Sales Manager Routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.SALES_MANAGER]} />}>
            <Route path="/sales/dashboard" element={<SalesDashboard />} />
            <Route path="/sales/orders" element={<SalesOrdersPage />} />
            <Route path="/sales/availability" element={<InventoryAvailabilityPage />} />
            <Route path="/sales/invoices" element={<InvoicesPage />} />
            <Route path="/sales/returns" element={<ReturnsPage />} />
            <Route path="/sales/reports" element={<SalesReportsPage />} />
            {/* Delivery & Fleet Management under Sales Manager */}
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
            <Route path="/delivery/assigned" element={<AssignedDeliveriesPage />} />
            <Route path="/delivery/tracking" element={<DeliveryTrackingPage />} />
            <Route path="/delivery/history" element={<DeliveryHistoryPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
