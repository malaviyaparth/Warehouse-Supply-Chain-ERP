import React, { useState, useEffect } from "react";
import { Boxes, CheckCircle2, AlertTriangle, RefreshCw, Warehouse as WarehouseIcon } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const InventoryAvailabilityPage = () => {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchWarehouses = async () => {
    try {
      const res = await axiosInstance.get("/api/warehouses");
      const list = res.data?.data || res.data || [];
      setWarehouses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const url = selectedWarehouse
        ? `/api/inventory?warehouse=${selectedWarehouse}`
        : "/api/inventory";
      const res = await axiosInstance.get(url);
      const list = res.data?.data || res.data || [];
      setInventory(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load stock availability matrix.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouse]);

  const columns = [
    {
      header: "Warehouse",
      accessor: "warehouse",
      render: (val) => (
        <span style={{ fontWeight: "600", color: "var(--color-slate-800)" }}>
          {val?.name || val?.warehouseName || "Facility"}
        </span>
      ),
    },
    {
      header: "Product SKU & Description",
      accessor: "product",
      render: (p) => (
        <div>
          <div style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>
            {p?.productName || "Unknown Product"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-primary-700)" }}>
            SKU: {p?.sku || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Physical Stock",
      accessor: "quantity",
      render: (val) => <span style={{ fontWeight: "600" }}>{val?.toLocaleString() || 0}</span>,
    },
    {
      header: "Committed / Reserved",
      accessor: "reservedStock",
      render: (val) => (
        <span style={{ color: "var(--color-warning-700)", fontWeight: "600" }}>
          {val?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      header: "Available-To-Promise (ATP)",
      accessor: "_id",
      render: (_, row) => {
        const atp = Math.max(0, (row.quantity || 0) - (row.reservedStock || 0));
        return (
          <span
            style={{
              fontWeight: "800",
              color: atp <= 0 ? "var(--color-rose-600)" : atp < 15 ? "var(--color-amber-600)" : "var(--color-emerald-600)",
              fontSize: "14px",
            }}
          >
            {atp.toLocaleString()} Units
          </span>
        );
      },
    },
    {
      header: "Quarantined Damaged",
      accessor: "damagedStock",
      render: (val) => (
        <span style={{ color: val > 0 ? "var(--color-rose-600)" : "var(--color-slate-400)" }}>
          {val || 0}
        </span>
      ),
    },
    {
      header: "Feasibility Status",
      accessor: "_id",
      render: (_, row) => {
        const atp = Math.max(0, (row.quantity || 0) - (row.reservedStock || 0));
        let status = "AVAILABLE IN FULL";
        let badgeClass = "badge-active";
        if (atp <= 0) {
          status = "OUT OF STOCK";
          badgeClass = "badge-inactive";
        } else if (atp < 15) {
          status = "TIGHT SUPPLY";
          badgeClass = "badge-warning";
        }
        return <span className={`badge ${badgeClass}`}>{status}</span>;
      },
    },
  ];

  const totalAtp = inventory.reduce((acc, i) => acc + Math.max(0, (i.quantity || 0) - (i.reservedStock || 0)), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Stock Availability & ATP Matrix</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Real-time Available-To-Promise (ATP) calculations per facility preventing overselling across sales orders.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--color-slate-300)" }}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name || w.warehouseName}
              </option>
            ))}
          </select>
          <button type="button" className="btn-secondary" onClick={fetchInventory} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Active SKUs</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
              <Boxes size={20} />
            </div>
          </div>
          <div className="stat-value">{inventory.length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Catalog product locations</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Available To Promise</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-success-50)", color: "var(--color-success-700)" }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="stat-value">{totalAtp.toLocaleString()}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Uncommitted salable units</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Hard Committed Reserved</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-warning-50)", color: "var(--color-warning-700)" }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value">
            {inventory.reduce((acc, i) => acc + (i.reservedStock || 0), 0).toLocaleString()}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Locked for pending sales</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading real-time availability matrix...
        </div>
      ) : inventory.length === 0 ? (
        <div className="empty-state">
          <Boxes size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No inventory items found</h3>
          <p>Assign inventory balances to warehouse facilities to calculate Available-To-Promise stock.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inventory}
          searchPlaceholder="Search product SKU or name..."
        />
      )}
    </div>
  );
};

export default InventoryAvailabilityPage;
