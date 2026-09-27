import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, DollarSign, CheckCircle2, RotateCcw, Plus, RefreshCw } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const SalesDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [soRes, retRes] = await Promise.all([
        axiosInstance.get("/api/sales-orders"),
        axiosInstance.get("/api/returns"),
      ]);

      const soList = soRes.data?.data || soRes.data || [];
      const retList = retRes.data?.data || retRes.data || [];

      setOrders(Array.isArray(soList) ? soList : []);
      setReturns(Array.isArray(retList) ? retList : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load sales dashboard metrics.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRevenue = orders.reduce((acc, so) => acc + (so.totalAmount || 0), 0);
  const openOrders = orders.filter((so) => ["PENDING", "CONFIRMED", "PROCESSING"].includes(so.status));
  const fulfilledOrders = orders.filter((so) => ["SHIPPED", "DELIVERED"].includes(so.status));
  const pendingReturns = returns.filter((r) => r.status !== "COMPLETED" && r.status !== "REJECTED");
  const recentOrders = orders.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Commercial Sales & Fulfillment</h1>
          <p>Customer orders, stock reservation matrix, billing dispatch, and RMA returns</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <Link to="/sales/availability" className="btn-secondary">
            <span>Stock Availability Matrix</span>
          </Link>
          <Link to="/sales/orders" className="btn-primary">
            <Plus size={16} />
            <span>New Sales Order</span>
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          title="Total Contract Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          trend={`${orders.length} total orders recorded`}
          trendPositive={true}
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Active Customer Orders"
          value={openOrders.length}
          trend={`${fulfilledOrders.length} fulfilled orders`}
          trendPositive={true}
          icon={ShoppingCart}
          colorScheme="indigo"
        />
        <StatCard
          title="Fulfillment Performance"
          value={orders.length > 0 ? `${Math.round((fulfilledOrders.length / orders.length) * 100)}%` : "0%"}
          trend="Completed dispatch rate"
          trendPositive={true}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatCard
          title="Open RMA Claims"
          value={pendingReturns.length}
          trend={pendingReturns.length > 0 ? "Under inspection in staging" : "No pending claims"}
          trendPositive={pendingReturns.length === 0}
          icon={RotateCcw}
          colorScheme="amber"
        />
      </div>

      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <div className="card-panel-title">Recent Commercial Sales Orders</div>
            <div className="card-panel-subtitle">Latest confirmed customer sales contracts and order lines</div>
          </div>
          <Link to="/sales/orders" style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--color-primary-600)" }}>
            View All Sales Orders &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--color-slate-500)" }}>
            Loading recent sales orders...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={44} style={{ margin: "0 auto", opacity: 0.3 }} />
            <h3>No sales orders created yet</h3>
            <p>Create a new sales order to initiate commercial pipeline tracking.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Sales Order #</th>
                  <th>Enterprise Client</th>
                  <th>Fulfillment Facility</th>
                  <th>Order Items</th>
                  <th>Contract Total</th>
                  <th>Order Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((so) => (
                  <tr key={so._id}>
                    <td style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
                      {so.salesOrderNumber || `SO-${so._id.slice(-6).toUpperCase()}`}
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
                      {so.customer?.customerName || so.customer?.name || "Client"}
                    </td>
                    <td>{so.warehouse?.name || so.warehouse?.warehouseName || "Warehouse"}</td>
                    <td>
                      {so.items && so.items.length > 0
                        ? so.items.map((it, idx) => (
                            <span key={idx}>
                              {it.product?.productName || "Product"} ({it.quantity})
                              {idx < so.items.length - 1 ? ", " : ""}
                            </span>
                          ))
                        : "—"}
                    </td>
                    <td style={{ fontWeight: "700" }}>${so.totalAmount?.toLocaleString() || 0}</td>
                    <td>
                      <span
                        className={`badge ${
                          so.status === "DELIVERED" || so.status === "SHIPPED"
                            ? "badge-active"
                            : so.status === "CONFIRMED" || so.status === "PROCESSING"
                            ? "badge-info"
                            : "badge-pending"
                        }`}
                      >
                        {so.status}
                      </span>
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

export default SalesDashboard;
