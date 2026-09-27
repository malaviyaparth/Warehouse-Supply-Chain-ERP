import React, { useState, useEffect } from "react";
import { ClipboardCheck, CheckCircle2, AlertTriangle, RefreshCw, Warehouse as WarehouseIcon } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const StockAuditPage = () => {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Reconciliation Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [physicalCount, setPhysicalCount] = useState(0);
  const [auditReason, setAuditReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        message: err.response?.data?.message || "Failed to load warehouse inventory for audit.",
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

  const openAuditModal = (item) => {
    setSelectedItem(item);
    setPhysicalCount(item.quantity || 0);
    setAuditReason(`Physical stock audit reconciliation on ${new Date().toLocaleDateString()}`);
    setIsModalOpen(true);
  };

  const handleReconcile = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await axiosInstance.put(`/api/inventory/${selectedItem._id}/adjust`, {
        newQuantity: Number(physicalCount),
        reason: auditReason,
      });

      setToast({
        type: "success",
        message: `Inventory balance adjusted successfully for ${selectedItem.product?.productName || "item"}.`,
      });
      setIsModalOpen(false);
      fetchInventory();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to reconcile stock variance.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: "Warehouse",
      accessor: "warehouse",
      render: (val) => (
        <span style={{ fontWeight: "600", color: "var(--color-slate-800)" }}>
          {val?.name || val?.warehouseName || "Warehouse"}
        </span>
      ),
    },
    {
      header: "Product SKU & Name",
      accessor: "product",
      render: (p) => (
        <div>
          <div style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
            {p?.productName || "Unknown Product"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-slate-400)" }}>
            SKU: {p?.sku || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "System Quantity",
      accessor: "quantity",
      render: (val) => <span style={{ fontWeight: "700" }}>{val?.toLocaleString() ?? 0}</span>,
    },
    {
      header: "Reserved Stock",
      accessor: "reservedStock",
      render: (val) => (
        <span style={{ color: "var(--color-warning-700)", fontWeight: "600" }}>
          {val?.toLocaleString() ?? 0}
        </span>
      ),
    },
    {
      header: "Available Count",
      accessor: "_id",
      render: (_, row) => {
        const avail = Math.max(0, (row.quantity || 0) - (row.reservedStock || 0));
        return (
          <span style={{ color: "var(--color-emerald-700)", fontWeight: "700" }}>
            {avail.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: "Damaged Stock",
      accessor: "damagedStock",
      render: (val) => (
        <span style={{ color: val > 0 ? "var(--color-rose-600)" : "var(--color-slate-400)" }}>
          {val ?? 0}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (_, row) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: "4px 8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
          onClick={() => openAuditModal(row)}
        >
          <ClipboardCheck size={14} /> Audit / Reconcile
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Warehouse Stock Audit & Count Reconciliation</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Conduct physical cycle counts per warehouse facility and reconcile variances against system balances.
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
            <span className="stat-card-title">Audited Stock Records</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
              <WarehouseIcon size={20} />
            </div>
          </div>
          <div className="stat-value">{inventory.length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Active inventory slots</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Physical Stock Units</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-success-50)", color: "var(--color-success-700)" }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="stat-value">
            {inventory.reduce((acc, i) => acc + (i.quantity || 0), 0).toLocaleString()}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Units across facilities</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Damaged Quarantine Units</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-rose-50)", color: "var(--color-rose-700)" }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value">
            {inventory.reduce((acc, i) => acc + (i.damagedStock || 0), 0).toLocaleString()}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Non-fulfillable units</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading inventory audit balances...
        </div>
      ) : inventory.length === 0 ? (
        <div className="empty-state">
          <ClipboardCheck size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No inventory items found</h3>
          <p>Assign products to warehouse facilities to begin conducting cycle count audits.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inventory}
          searchPlaceholder="Search product SKU or name..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Physical Cycle Count Reconciliation"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleReconcile}
              disabled={submitting}
            >
              {submitting ? "Reconciling..." : "Save Count Adjustment"}
            </button>
          </>
        }
      >
        <form onSubmit={handleReconcile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "12px", background: "var(--color-slate-50)", borderRadius: "6px" }}>
            <div style={{ fontWeight: "700" }}>{selectedItem?.product?.productName}</div>
            <div style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
              Facility: {selectedItem?.warehouse?.name || selectedItem?.warehouse?.warehouseName} &bull; SKU: {selectedItem?.product?.sku}
            </div>
            <div style={{ marginTop: "8px", fontSize: "13px" }}>
              Current System Balance: <strong>{selectedItem?.quantity}</strong> units (Reserved: {selectedItem?.reservedStock || 0})
            </div>
          </div>

          <div className="form-field">
            <label>Physical Count Found (Actual on hand) *</label>
            <input
              type="number"
              min={selectedItem?.reservedStock || 0}
              required
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value)}
            />
            {Number(physicalCount) < (selectedItem?.reservedStock || 0) && (
              <span style={{ fontSize: "12px", color: "var(--color-rose-600)" }}>
                Cannot reduce below reserved stock ({selectedItem?.reservedStock}).
              </span>
            )}
            <div style={{ fontSize: "12px", color: "var(--color-slate-500)", marginTop: "4px" }}>
              Variance: {Number(physicalCount) - (selectedItem?.quantity || 0)} units
            </div>
          </div>

          <div className="form-field">
            <label>Audit Reason / Variance Explanation *</label>
            <textarea
              rows="3"
              required
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Q3 physical inventory verification discrepancy."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StockAuditPage;
