import React, { useState, useEffect } from "react";
import { Boxes, RefreshCw } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const WarehouseInventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = selectedWarehouse
        ? `/api/inventory?warehouse=${selectedWarehouse}`
        : "/api/inventory";

      const [invRes, whRes] = await Promise.all([
        api.get(url),
        api.get("/api/warehouses"),
      ]);

      setInventory(invRes.data?.data || []);
      setWarehouses(whRes.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load facility inventory.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse]);

  const columns = [
    {
      header: "SKU & Item",
      accessor: "product",
      render: (prod) => (
        <div>
          <div style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>
            {prod?.productName || "Product"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-primary-700)" }}>
            {prod?.sku} {prod?.barcode ? `• 🏷️ ${prod.barcode}` : ""}
          </div>
        </div>
      ),
    },
    {
      header: "Warehouse Facility",
      accessor: "warehouse",
      render: (wh) => (
        <div>
          <div style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
            {wh?.warehouseName || "—"}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--color-slate-400)" }}>
            {wh?.location || ""}
          </div>
        </div>
      ),
    },
    {
      header: "Total On-Hand",
      accessor: "quantity",
      render: (val) => <span style={{ fontWeight: "700" }}>{Number(val || 0).toLocaleString()} Units</span>,
    },
    {
      header: "Reserved Stock",
      accessor: "reservedStock",
      render: (val) => (
        <span style={{ color: "var(--color-amber-600)", fontWeight: "600" }}>
          {Number(val || 0).toLocaleString()} Units
        </span>
      ),
    },
    {
      header: "Damaged Stock",
      accessor: "damagedStock",
      render: (val) => (
        <span style={{ color: "var(--color-rose-600)", fontWeight: "600" }}>
          {Number(val || 0).toLocaleString()} Units
        </span>
      ),
    },
    {
      header: "Available to Promise",
      accessor: "quantity",
      render: (qty, row) => {
        const available = Math.max(0, (qty || 0) - (row.reservedStock || 0));
        return (
          <span style={{ color: "var(--color-emerald-600)", fontWeight: "700" }}>
            {available.toLocaleString()} Units
          </span>
        );
      },
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Facility Storage & Bin Inventory</h1>
          <p>Bin-level on-hand tracking, physical warehouse stock associations, and reservations</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.warehouseName}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading warehouse inventory balances...
        </div>
      ) : inventory.length === 0 ? (
        <div className="empty-state card-panel">
          <Boxes size={36} color="var(--color-slate-400)" />
          <h3>No Inventory Records for Facility</h3>
          <p>Stock-in items or receive purchase orders at this warehouse to track stock.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inventory}
          searchKey="quantity"
          searchPlaceholder="Search warehouse inventory..."
        />
      )}
    </div>
  );
};

export default WarehouseInventoryPage;
