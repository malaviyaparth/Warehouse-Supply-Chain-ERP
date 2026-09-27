import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Sliders } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const StockAdjustmentPage = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    inventoryId: "",
    newQuantity: 0,
    reason: "Cycle count physical reconciliation",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adjRes, invRes] = await Promise.all([
        api.get("/api/stock-movements?type=ADJUSTMENT"),
        api.get("/api/inventory"),
      ]);

      setAdjustments(adjRes.data?.data || []);
      const invList = invRes.data?.data || [];
      setInventories(invList);

      if (invList.length > 0 && !formData.inventoryId) {
        setFormData((prev) => ({
          ...prev,
          inventoryId: invList[0]._id,
          newQuantity: invList[0].quantity,
        }));
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load stock adjustments.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectInventory = (invId) => {
    const selected = inventories.find((i) => i._id === invId);
    setFormData((prev) => ({
      ...prev,
      inventoryId: invId,
      newQuantity: selected ? selected.quantity : 0,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.inventoryId || formData.newQuantity < 0) return;
    setSubmitting(true);
    try {
      await api.put(`/api/inventory/${formData.inventoryId}/adjust`, {
        quantity: Number(formData.newQuantity),
        reason: formData.reason,
      });
      setToast({ message: "Stock adjustment recorded successfully.", type: "success" });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to post adjustment.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: "Timestamp",
      accessor: "createdAt",
      render: (val) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
          {val ? new Date(val).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      header: "Adjusted Product",
      accessor: "product",
      render: (val) => (
        <div>
          <div style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
            {val?.productName || "Product"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-slate-400)" }}>
            {val?.sku}
          </div>
        </div>
      ),
    },
    {
      header: "Warehouse",
      accessor: "warehouse",
      render: (val) => val?.warehouseName || "—",
    },
    { header: "Pre-Balance", accessor: "previousQuantity" },
    {
      header: "Post-Balance",
      accessor: "newQuantity",
      render: (val) => <span style={{ fontWeight: "700" }}>{val} Units</span>,
    },
    {
      header: "Delta Variance",
      accessor: "quantity",
      render: (val, row) => {
        const delta = (row.newQuantity || 0) - (row.previousQuantity || 0);
        return (
          <span
            style={{
              fontWeight: "800",
              color: delta >= 0 ? "var(--color-emerald-600)" : "var(--color-rose-600)",
            }}
          >
            {delta >= 0 ? `+${delta}` : delta} Units
          </span>
        );
      },
    },
    {
      header: "Authorizer / Operator",
      accessor: "performedBy",
      render: (val) => val?.name || "System Inventory Staff",
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Stock Reconciliations & Adjustments</h1>
          <p>Manual physical count overrides, shrinkage corrections, and variance audit trails</p>
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
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            <span>Post Manual Adjustment</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading adjustment variance logs...
        </div>
      ) : adjustments.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Adjustments Logged</h3>
          <p>All warehouse stock records are aligned with physical ledger counts.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={adjustments}
          searchKey="previousQuantity"
          searchPlaceholder="Search adjustments..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Execute Manual Inventory Adjustment"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="adj-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Posting..." : "Post Adjustment"}
            </button>
          </>
        }
      >
        <form id="adj-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label>Target Inventory Bin & Product *</label>
            <select
              value={formData.inventoryId}
              onChange={(e) => handleSelectInventory(e.target.value)}
              required
            >
              {inventories.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.product?.productName} ({i.product?.sku}) @ {i.warehouse?.warehouseName} [Current: {i.quantity} / Res: {i.reservedStock || 0}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>New Verified Physical Count *</label>
            <input
              type="number"
              min="0"
              required
              value={formData.newQuantity}
              onChange={(e) => setFormData({ ...formData, newQuantity: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Audit Justification / Root Cause *</label>
            <textarea
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="State reason for manual discrepancy reconciliation..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StockAdjustmentPage;
