import React, { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const StockOutPage = () => {
  const [outbounds, setOutbounds] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    product: "",
    warehouse: "",
    quantity: 10,
    reason: "Sales order manual picking",
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moveRes, prodRes, whRes] = await Promise.all([
        api.get("/api/stock-movements?type=STOCK_OUT"),
        api.get("/api/products"),
        api.get("/api/warehouses"),
      ]);

      setOutbounds(moveRes.data?.data || []);
      const prods = prodRes.data?.data || [];
      const whs = whRes.data?.data || [];
      setProducts(prods);
      setWarehouses(whs);

      if (prods.length > 0 && !formData.product) {
        setFormData((prev) => ({
          ...prev,
          product: prods[0]._id,
          warehouse: whs[0]?._id || "",
        }));
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load outbound movements.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.product || !formData.warehouse || formData.quantity <= 0) return;
    setSubmitting(true);
    try {
      await api.post("/api/inventory/stock-out", {
        product: formData.product,
        warehouse: formData.warehouse,
        quantity: Number(formData.quantity),
        reason: formData.reason,
        remarks: formData.remarks,
      });
      setToast({ message: "Stock-out deducted successfully.", type: "success" });
      setIsModalOpen(false);
      setFormData({
        product: products[0]?._id || "",
        warehouse: warehouses[0]?._id || "",
        quantity: 10,
        reason: "Sales order manual picking",
        remarks: "",
      });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to process stock deduction.",
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
      header: "Product Item",
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
      header: "Outbound Qty",
      accessor: "quantity",
      render: (val) => (
        <span style={{ fontWeight: "700", color: "var(--color-rose-600)" }}>
          -{val?.toLocaleString()} Units
        </span>
      ),
    },
    {
      header: "Dispatch Facility",
      accessor: "warehouse",
      render: (val) => val?.warehouseName || "—",
    },
    {
      header: "Stock Delta",
      accessor: "newQuantity",
      render: (val, row) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-600)" }}>
          {row.previousQuantity} &rarr; <strong>{val}</strong>
        </span>
      ),
    },
    {
      header: "Context Reference",
      accessor: "referenceType",
      render: (val) => <span style={{ fontWeight: "600" }}>{val || "SALE"}</span>,
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Stock Outbound Fulfillment Operations</h1>
          <p>Sales order picking deductions, bill of lading dispatches, and warehouse inventory deductions</p>
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
            <span>Process Stock Outbound</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading outbound fulfillment records...
        </div>
      ) : outbounds.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Outbound Deductions Found</h3>
          <p>Execute a stock-out picking operation to deduct inventory from a warehouse.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={outbounds}
          searchKey="referenceType"
          searchPlaceholder="Filter outbounds by reference or ID..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Execute Stock-Out Picking Deduction"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="stockout-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Deducting..." : "Deduct Inventory"}
            </button>
          </>
        }
      >
        <form id="stockout-form" onSubmit={handleCreate}>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Target Product *</label>
              <select
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                required
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.sku} — {p.productName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Quantity to Deduct *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Dispatching Warehouse *</label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Reason / Authorization</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. Sales Order picking fulfillment"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StockOutPage;
