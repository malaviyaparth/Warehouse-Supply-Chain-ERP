import React, { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const StockInPage = () => {
  const [inbounds, setInbounds] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    product: "",
    warehouse: "",
    quantity: 100,
    poRef: "",
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moveRes, prodRes, whRes] = await Promise.all([
        api.get("/api/stock-movements?type=STOCK_IN"),
        api.get("/api/products"),
        api.get("/api/warehouses"),
      ]);

      setInbounds(moveRes.data?.data || []);
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
        message: err.response?.data?.message || "Failed to load inbound intake history.",
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
      await api.post("/api/inventory/stock-in", {
        product: formData.product,
        warehouse: formData.warehouse,
        quantity: Number(formData.quantity),
        poRef: formData.poRef || undefined,
        remarks: formData.remarks || undefined,
      });
      setToast({ message: "Stock-in intake processed successfully.", type: "success" });
      setIsModalOpen(false);
      setFormData({
        product: products[0]?._id || "",
        warehouse: warehouses[0]?._id || "",
        quantity: 100,
        poRef: "",
        remarks: "",
      });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to process stock intake.",
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
      header: "Item Description",
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
      header: "Quantity Ingested",
      accessor: "quantity",
      render: (val) => (
        <span style={{ fontWeight: "700", color: "var(--color-emerald-600)" }}>
          +{val?.toLocaleString()} Units
        </span>
      ),
    },
    {
      header: "Target Facility",
      accessor: "warehouse",
      render: (val) => val?.warehouseName || "—",
    },
    {
      header: "Stock Balance",
      accessor: "newQuantity",
      render: (val, row) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-600)" }}>
          {row.previousQuantity} &rarr; <strong>{val}</strong>
        </span>
      ),
    },
    {
      header: "Origin Reference",
      accessor: "referenceType",
      render: (val) => <span style={{ fontWeight: "600" }}>{val || "MANUAL"}</span>,
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Stock Inbound Intake Operations</h1>
          <p>Direct physical intake logging, barcode receipt scanning, and inventory incrementing</p>
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
            <span>Process Inbound Intake</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading inbound intake history...
        </div>
      ) : inbounds.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Inbound Movements Recorded</h3>
          <p>Log a physical stock-in entry to record received items into a warehouse.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inbounds}
          searchKey="referenceType"
          searchPlaceholder="Filter inbound intakes by reference or ID..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Execute Physical Stock-In Entry"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="stockin-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Processing..." : "Record Inbound"}
            </button>
          </>
        }
      >
        <form id="stockin-form" onSubmit={handleCreate}>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Target Product SKU *</label>
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
              <label>Intake Quantity *</label>
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
              <label>Receiving Warehouse *</label>
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
              <label>Source PO / Waybill Ref</label>
              <input
                type="text"
                value={formData.poRef}
                onChange={(e) => setFormData({ ...formData, poRef: e.target.value })}
                placeholder="e.g. PO-2026-092"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StockInPage;
