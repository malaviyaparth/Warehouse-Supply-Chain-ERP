import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  UserPlus,
  FileText,
  Boxes,
  Clock,
  RefreshCw,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import api from "../../api/axios";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    totalVendors: 0,
    totalEmployees: 0,
    activeRoles: 0,
    pendingPurchases: 0,
    pendingSalesOrders: 0,
    totalSales: 0,
    totalPurchase: 0,
    lowStockCount: 0,
  });

  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, empRes, roleRes, auditRes] = await Promise.all([
        api.get("/api/dashboard"),
        api.get("/api/employees"),
        api.get("/api/roles"),
        api.get("/api/audit-logs?limit=5"),
      ]);

      const summary = dashRes.data?.data?.summary || {};
      setStats({
        totalProducts: summary.totalProducts || 0,
        totalWarehouses: summary.totalWarehouses || 0,
        totalVendors: summary.totalVendors || 0,
        totalEmployees: empRes.data?.data?.length || 0,
        activeRoles: roleRes.data?.data?.length || 0,
        pendingPurchases: summary.pendingPurchases || 0,
        pendingSalesOrders: summary.pendingSalesOrders || 0,
        totalSales: summary.totalSales || 0,
        totalPurchase: summary.totalPurchase || 0,
        lowStockCount: summary.lowStockCount || 0,
      });

      setRecentAudits(auditRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Super Admin Command Center</h1>
          <p>Global oversight, security logs, and cross-department ERP metrics</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/employees" className="btn-secondary">
            <UserPlus size={15} />
            <span>Manage Staff</span>
          </Link>
          <Link to="/admin/reports" className="btn-primary">
            <FileText size={15} />
            <span>Executive Reports</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-row">
        <StatCard
          title="Total Workforce"
          value={stats.totalEmployees}
          trend={`${stats.totalEmployees} active personnel`}
          trendPositive={true}
          icon={Users}
          colorScheme="indigo"
        />
        <StatCard
          title="Configured Roles"
          value={stats.activeRoles}
          trend="Strict RBAC Active"
          trendPositive={true}
          icon={ShieldCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Active Warehouses"
          value={stats.totalWarehouses}
          trend="Multi-facility enabled"
          trendPositive={true}
          icon={Building2}
          colorScheme="amber"
        />
        <StatCard
          title="Gross Sales Volume"
          value={`$${Number(stats.totalSales || 0).toLocaleString()}`}
          trend={`Total PO Value: $${Number(stats.totalPurchase || 0).toLocaleString()}`}
          trendPositive={true}
          icon={DollarSign}
          colorScheme="emerald"
        />
      </div>

      {/* Two Columns: Operational Health & Recent Audit Feed */}
      <div className="charts-grid-2">
        {/* Module Health Overview */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <div className="card-panel-title">ERP Subsystem Status</div>
              <div className="card-panel-subtitle">Real-time health monitoring of enterprise modules</div>
            </div>
            <span className="badge badge-active">Live System Online</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              {
                name: "Procurement & Vendor Gateway",
                route: "/purchase/dashboard",
                status: "Healthy",
                count: `${stats.pendingPurchases} Pending Purchases`,
                color: "var(--color-emerald-500)",
              },
              {
                name: "Warehouse Storage & WMS",
                route: "/warehouse/dashboard",
                status: "Optimal",
                count: `${stats.totalWarehouses} Active Facilities`,
                color: "var(--color-emerald-500)",
              },
              {
                name: "Inventory Catalog & Barcodes",
                route: "/inventory/dashboard",
                status: "Synchronized",
                count: `${stats.totalProducts} Active SKUs (${stats.lowStockCount} Low)`,
                color: stats.lowStockCount > 0 ? "var(--color-amber-500)" : "var(--color-emerald-500)",
              },
              {
                name: "Sales & Dispatch Fulfillment",
                route: "/sales/dashboard",
                status: "Healthy",
                count: `${stats.pendingSalesOrders} Pending Orders`,
                color: "var(--color-emerald-500)",
              },
              {
                name: "Delivery Logistics Fleet",
                route: "/delivery/dashboard",
                status: "Active",
                count: "Fleet Logistics Active",
                color: "var(--color-emerald-500)",
              },
            ].map((sub, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-slate-50)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: sub.color }} />
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--color-slate-800)" }}>{sub.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>{sub.count}</div>
                  </div>
                </div>
                <Link to={sub.route} style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-primary-600)", display: "flex", alignItems: "center", gap: "3px" }}>
                  <span>Launch</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Audit Trail */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div>
              <div className="card-panel-title">Real-Time Security & Audit Feed</div>
              <div className="card-panel-subtitle">Latest compliance events and administrative actions</div>
            </div>
            <Link to="/admin/audit" style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--color-primary-600)" }}>
              View All Logs
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {recentAudits.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-slate-400)", fontSize: "13px" }}>
                No audit log events recorded yet.
              </div>
            ) : (
              recentAudits.map((log) => (
                <div
                  key={log._id}
                  style={{
                    padding: "12px 14px",
                    borderLeft: "3px solid var(--color-primary-600)",
                    background: "var(--color-slate-50)",
                    borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-slate-800)" }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-slate-400)" }}>
                        &bull; {log.employee?.name || "System"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--color-slate-600)" }}>
                      {log.description || "Activity recorded"}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-slate-400)", whiteSpace: "nowrap", marginLeft: "10px" }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
