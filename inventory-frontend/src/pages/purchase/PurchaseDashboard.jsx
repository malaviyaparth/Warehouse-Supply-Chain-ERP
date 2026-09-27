import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, FileText, Building2, PackageCheck, Plus, RefreshCw, TrendingUp } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import api from "../../api/axios";

export const PurchaseDashboard = () => {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeOrders: 0,
    totalPurchases: 0,
    receivedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, prRes, poRes] = await Promise.all([
        api.get("/api/dashboard"),
        api.get("/api/purchase-requests?status=PENDING"),
        api.get("/api/purchases?limit=10"),
      ]);

      const data = dashRes.data?.data?.summary || {};
      const pendingPRs = prRes.data?.data?.length || data.pendingPurchaseRequests || 0;
      const allPOs = poRes.data?.data || [];

      const receivedCount = allPOs.filter((p) => p.status === "RECEIVED").length;

      setStats({
        pendingRequests: pendingPRs,
        activeOrders: data.pendingPurchases || allPOs.length,
        totalPurchases: data.totalPurchase || 0,
        receivedOrders: receivedCount,
      });

      setRecentOrders(allPOs.slice(0, 5));
    } catch (err) {
      console.error("Failed to load purchase dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Procurement & Purchase Command</h1>
          <p>Vendor pipelines, purchase requisitions, PO lifecycle, and dock receiving status</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <Link to="/purchase/requests" className="btn-secondary">
            <span>Review Requisitions ({stats.pendingRequests})</span>
          </Link>
          <Link to="/purchase/orders" className="btn-primary">
            <Plus size={16} />
            <span>Create Purchase Order</span>
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          title="Pending Requisitions"
          value={stats.pendingRequests}
          trend="Demands awaiting approval"
          trendPositive={stats.pendingRequests === 0}
          icon={ShoppingCart}
          colorScheme={stats.pendingRequests > 0 ? "amber" : "emerald"}
        />
        <StatCard
          title="Active Purchase Orders"
          value={stats.activeOrders}
          trend="Commercial orders in pipeline"
          trendPositive={true}
          icon={FileText}
          colorScheme="indigo"
        />
        <StatCard
          title="Total Procurement Value"
          value={`$${Number(stats.totalPurchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend="Committed PO capital"
          trendPositive={true}
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <StatCard
          title="Completed Receipts"
          value={stats.receivedOrders}
          trend="Fulfilled purchase deliveries"
          trendPositive={true}
          icon={PackageCheck}
          colorScheme="emerald"
        />
      </div>

      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <div className="card-panel-title">Active Purchase Orders Tracking</div>
            <div className="card-panel-subtitle">Latest purchase commitments and delivery fulfillment states</div>
          </div>
          <Link to="/purchase/orders" style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--color-primary-600)" }}>
            View All POs
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
            Loading procurement data...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="empty-state">
            <p>No active purchase orders issued yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier / Vendor</th>
                  <th>Delivery Warehouse</th>
                  <th>Order Date</th>
                  <th>Contract Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((po) => (
                  <tr key={po._id}>
                    <td style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
                      {po.purchaseOrderNumber}
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--color-slate-800)" }}>
                      {po.vendor?.vendorName || "Supplier"}
                    </td>
                    <td>{po.warehouse?.warehouseName || "—"}</td>
                    <td>{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "—"}</td>
                    <td style={{ fontWeight: "700" }}>
                      ${Number(po.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className="badge badge-info">{po.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseDashboard;
