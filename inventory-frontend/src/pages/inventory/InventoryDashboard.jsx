import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, AlertCircle, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import api from "../../api/axios";

export const InventoryDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    stockInCount: 0,
    stockOutCount: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, moveInRes, moveOutRes] = await Promise.all([
        api.get("/api/dashboard"),
        api.get("/api/stock-movements?type=STOCK_IN&limit=50"),
        api.get("/api/stock-movements?type=STOCK_OUT&limit=50"),
      ]);

      const data = dashRes.data?.data || {};
      const summary = data.summary || {};

      const inTotal = (moveInRes.data?.data || []).reduce((acc, m) => acc + (m.quantity || 0), 0);
      const outTotal = (moveOutRes.data?.data || []).reduce((acc, m) => acc + (m.quantity || 0), 0);

      setStats({
        totalProducts: summary.totalProducts || 0,
        lowStockCount: summary.lowStockCount || 0,
        stockInCount: inTotal,
        stockOutCount: outTotal,
      });

      setLowStockItems(data.lowStockProducts || []);
    } catch (err) {
      console.error("Failed to load inventory dashboard data:", err);
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
          <h1>Inventory & Catalog Command</h1>
          <p>Product catalog, stock replenishment thresholds, physical movement, and barcode tagging</p>
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
          <Link to="/inventory/stock-in" className="btn-secondary">
            <ArrowDownLeft size={15} />
            <span>Process Stock In</span>
          </Link>
          <Link to="/inventory/products" className="btn-primary">
            <Plus size={16} />
            <span>Add New Product SKU</span>
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          title="Active Catalog SKUs"
          value={stats.totalProducts}
          trend="Centralized catalog master"
          trendPositive={true}
          icon={Package}
          colorScheme="indigo"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockCount}
          trend={`${stats.lowStockCount} items below ROP threshold`}
          trendPositive={stats.lowStockCount === 0}
          icon={AlertCircle}
          colorScheme={stats.lowStockCount > 0 ? "rose" : "emerald"}
        />
        <StatCard
          title="Stock Ingested"
          value={`+${stats.stockInCount.toLocaleString()} Units`}
          trend="Recorded Inbound Movements"
          trendPositive={true}
          icon={ArrowDownLeft}
          colorScheme="emerald"
        />
        <StatCard
          title="Stock Dispatched"
          value={`-${stats.stockOutCount.toLocaleString()} Units`}
          trend="Recorded Outbound Movements"
          trendPositive={true}
          icon={ArrowUpRight}
          colorScheme="amber"
        />
      </div>

      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <div className="card-panel-title">Replenishment Priority Queue</div>
            <div className="card-panel-subtitle">Items currently below minimum safety stock reorder thresholds</div>
          </div>
          <Link to="/inventory/products" style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--color-primary-600)" }}>
            View Full Inventory
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
            Scanning inventory levels across warehouses...
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="empty-state">
            <p>All warehouse inventory levels are currently above reorder thresholds.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Item SKU</th>
                  <th>Product Description</th>
                  <th>Warehouse Facility</th>
                  <th>Available Stock</th>
                  <th>Reorder Point (ROP)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: "monospace", fontWeight: "700", color: "var(--color-primary-700)" }}>
                      {item.sku}
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>{item.product}</td>
                    <td>{item.warehouse || "Central"}</td>
                    <td style={{ fontWeight: "700", color: "var(--color-rose-600)" }}>
                      {item.availableStock} Units
                    </td>
                    <td style={{ fontWeight: "600" }}>{item.reorderPoint} Units</td>
                    <td>
                      <span className="badge badge-inactive">
                        LOW STOCK
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

export default InventoryDashboard;
