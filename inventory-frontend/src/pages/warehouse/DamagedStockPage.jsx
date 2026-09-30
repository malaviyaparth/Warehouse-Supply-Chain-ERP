import React, { useState, useEffect } from "react";
import { AlertTriangle, Plus, RefreshCw, ShieldAlert, CheckCircle } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const DamagedStockPage = () => {
  const [damagedItems, setDamagedItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    warehouse: "",
    quantity: 1,
    reason: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, whRes, prodRes] = await Promise.all([
        axiosInstance.get("/api/inventory"),
        axiosInstance.get("/api/warehouses"),
        axiosInstance.get("/api/products"),
      ]);

      const allInv = invRes.data?.data || invRes.data || [];
      const whData = whRes.data?.data || whRes.data || [];
      const prodData = prodRes.data?.data || prodRes.data || [];

      // Filter only inventory records that have damaged stock
      const filtered = (Array.isArray(allInv) ? allInv : []).filter(
        (i) => (i.damagedStock || 0) > 0
      );

      setDamagedItems(filtered);
      setWarehouses(Array.isArray(whData) ? whData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);

      if (whData.length > 0 && !formData.warehouse) {
        setFormData((prev) => ({ ...prev, warehouse: whData[0]._id }));
      }
      if (prodData.length > 0 && !formData.product) {
        setFormData((prev) => ({ ...prev, product: prodData[0]._id }));
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load damaged stock records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!formData.product || !formData.warehouse) {
      setToast({ type: "error", message: "Please select both product and facility." });
      return;
    }
    if (Number(formData.quantity) <= 0) {
      setToast({ type: "error", message: "Quantity must be greater than zero." });
      return;
    }

    try {
      setSubmitting(true);
      await axiosInstance.post("/api/inventory/damaged", {
        product: formData.product,
        warehouse: formData.warehouse,
        quantity: Number(formData.quantity),
        reason: formData.reason || "Physical handling damage",
      });

      setToast({ type: "success", message: "Damaged stock recorded in quarantine successfully." });
      setIsModalOpen(false);
      setFormData((prev) => ({ ...prev, quantity: 1, reason: "" }));
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to record damaged incident.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: "Quarantined SKU & Product",
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
      header: "Facility / Bay",
      accessor: "warehouse",
      render: (w) => <span style={{ fontWeight: "600" }}>{w?.name || w?.warehouseName || "Facility"}</span>,
    },
    {
      header: "Quarantined Damaged Qty",
      accessor: "damagedStock",
      render: (val) => (
        <span style={{ fontWeight: "700", color: "var(--color-rose-600)", fontSize: "14px" }}>
          {val?.toLocaleString() || 0} units
        </span>
      ),
    },
    {
      header: "Active Salable Qty",
      accessor: "quantity",
      render: (val) => <span style={{ fontWeight: "600" }}>{val?.toLocaleString() || 0}</span>,
    },
    {
      header: "Governance Status",
      accessor: "_id",
      render: () => (
        <span className="badge badge-inactive">
          QUARANTINED
        </span>
      ),
    },
  ];

  const totalDamagedCount = damagedItems.reduce((acc, i) => acc + (i.damagedStock || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Damaged Stock & Scrap Quarantine</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Isolate defective inventory, track incident write-offs, and maintain uncompromised active warehouse counts.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Log Damaged Incident
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Quarantined SKUs</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-rose-50)", color: "var(--color-rose-700)" }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="stat-value">{damagedItems.length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Products with quarantine units</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Damaged Units</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-rose-100)", color: "var(--color-rose-800)" }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value">{totalDamagedCount.toLocaleString()}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Scrapped or non-salable items</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading damaged inventory records...
        </div>
      ) : damagedItems.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} style={{ margin: "0 auto", opacity: 0.3, color: "var(--color-emerald-600)" }} />
          <h3>No damaged stock in quarantine</h3>
          <p>Zero defective or damaged units are logged across all warehouse facilities.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={damagedItems}
          searchPlaceholder="Search product SKU or facility..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Damaged Stock Incident"
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
              onClick={handleCreateIncident}
              disabled={submitting}
            >
              {submitting ? "Quarantining..." : "Quarantine Stock"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateIncident} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-field">
            <label>Warehouse Facility *</label>
            <select
              value={formData.warehouse}
              onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
              required
            >
              <option value="">Select facility...</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name || w.warehouseName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Product *</label>
            <select
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              required
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.productName} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Damaged Quantity to Quarantine *</label>
            <input
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            <span style={{ fontSize: "12px", color: "var(--color-slate-500)", marginTop: "4px" }}>
              Units will be deducted from salable stock and quarantined under damaged inventory.
            </span>
          </div>

          <div className="form-field">
            <label>Root Cause / Incident Reason *</label>
            <textarea
              rows="3"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Pallet dropped during forklift transit in Aisle 04."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DamagedStockPage;
