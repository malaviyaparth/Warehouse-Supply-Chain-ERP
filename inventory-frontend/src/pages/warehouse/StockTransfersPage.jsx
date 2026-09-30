import React, { useState, useEffect } from "react";
import { Plus, ArrowLeftRight, CheckCircle, Truck, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const StockTransfersPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sourceWarehouse: "",
    destinationWarehouse: "",
    product: "",
    quantity: 1,
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trfRes, whRes, prodRes] = await Promise.all([
        axiosInstance.get("/api/stock-transfers"),
        axiosInstance.get("/api/warehouses"),
        axiosInstance.get("/api/products"),
      ]);

      const trfData = trfRes.data?.data || trfRes.data || [];
      const whData = whRes.data?.data || whRes.data || [];
      const pData = prodRes.data?.data || prodRes.data || [];

      setTransfers(Array.isArray(trfData) ? trfData : []);
      setWarehouses(Array.isArray(whData) ? whData : []);
      setProducts(Array.isArray(pData) ? pData : []);

      if (whData.length >= 2 && !formData.sourceWarehouse) {
        setFormData((prev) => ({
          ...prev,
          sourceWarehouse: whData[0]._id,
          destinationWarehouse: whData[1]._id,
        }));
      }
      if (pData.length > 0 && !formData.product) {
        setFormData((prev) => ({ ...prev, product: pData[0]._id }));
      }
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to load stock transfers." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.sourceWarehouse || !formData.destinationWarehouse || !formData.product) {
      setToast({ type: "error", message: "Please fill in all required fields." });
      return;
    }
    if (formData.sourceWarehouse === formData.destinationWarehouse) {
      setToast({ type: "error", message: "Source and destination warehouses cannot be the same." });
      return;
    }
    if (Number(formData.quantity) <= 0) {
      setToast({ type: "error", message: "Quantity must be greater than zero." });
      return;
    }

    try {
      setSubmitting(true);
      await axiosInstance.post("/api/stock-transfers", {
        sourceWarehouse: formData.sourceWarehouse,
        destinationWarehouse: formData.destinationWarehouse,
        items: [{ product: formData.product, quantity: Number(formData.quantity) }],
      });
      setToast({ type: "success", message: "Stock transfer initiated successfully." });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to create transfer." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axiosInstance.put(`/api/stock-transfers/${id}/approve`);
      setToast({ type: "success", message: "Stock transfer approved." });
      fetchData();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to approve transfer." });
    }
  };

  const handleDispatch = async (id) => {
    try {
      await axiosInstance.put(`/api/stock-transfers/${id}/dispatch`);
      setToast({ type: "success", message: "Transfer dispatched (In Transit)." });
      fetchData();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to dispatch transfer." });
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm("Complete stock transfer? This will deduct source inventory and add to destination inventory.")) {
      return;
    }
    try {
      await axiosInstance.put(`/api/stock-transfers/${id}/complete`);
      setToast({ type: "success", message: "Transfer completed and inventory updated!" });
      fetchData();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to complete transfer." });
    }
  };

  const columns = [
    {
      header: "Transfer ID",
      accessor: "_id",
      render: (val) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
          {val ? String(val).slice(-8).toUpperCase() : "-"}
        </span>
      ),
    },
    {
      header: "Source Warehouse",
      accessor: "sourceWarehouse",
      render: (val) => <span style={{ fontWeight: "600" }}>{val?.name || val?.warehouseName || "Source"}</span>,
    },
    {
      header: "Destination Warehouse",
      accessor: "destinationWarehouse",
      render: (val) => (
        <span style={{ fontWeight: "600", color: "var(--color-slate-800)" }}>
          {val?.name || val?.warehouseName || "Destination"}
        </span>
      ),
    },
    {
      header: "Items",
      accessor: "items",
      render: (val) => (
        <div>
          {val && val.length > 0
            ? val.map((item, idx) => (
                <div key={idx} style={{ fontSize: "13px" }}>
                  <strong>{item.product?.productName || "Product"}</strong> ({item.quantity} units)
                </div>
              ))
            : "No items"}
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "transferDate",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => {
        let badgeClass = "badge-pending";
        if (val === "COMPLETED") badgeClass = "badge-active";
        if (val === "APPROVED") badgeClass = "badge-info";
        if (val === "IN_TRANSIT") badgeClass = "badge-warning";
        return <span className={`badge ${badgeClass}`}>{val}</span>;
      },
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (id, row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          {row.status === "REQUESTED" && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={() => handleApprove(id)}
            >
              Approve
            </button>
          )}
          {row.status === "APPROVED" && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={() => handleDispatch(id)}
            >
              Dispatch
            </button>
          )}
          {(row.status === "IN_TRANSIT" || row.status === "APPROVED") && (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={() => handleComplete(id)}
            >
              Receive / Complete
            </button>
          )}
          {row.status === "COMPLETED" && (
            <span style={{ fontSize: "12px", color: "var(--color-success-700)", fontWeight: "600" }}>
              Fulfilled
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Inter-Facility Stock Transfers</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Audit, track, and complete multi-facility inventory reallocation workflows with atomic transactions.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Initiate Transfer
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Transfers</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
              <ArrowLeftRight size={20} />
            </div>
          </div>
          <div className="stat-value">{transfers.length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Lifetime logged transfers</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending / In Transit</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-warning-50)", color: "var(--color-warning-700)" }}>
              <Truck size={20} />
            </div>
          </div>
          <div className="stat-value">
            {transfers.filter((t) => ["REQUESTED", "APPROVED", "IN_TRANSIT"].includes(t.status)).length}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Active logistics movement</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Completed Transfers</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-success-50)", color: "var(--color-success-700)" }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">{transfers.filter((t) => t.status === "COMPLETED").length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Fully balanced inventory</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading inter-facility transfers...
        </div>
      ) : transfers.length === 0 ? (
        <div className="empty-state">
          <ArrowLeftRight size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No stock transfers recorded</h3>
          <p>Initiate a new transfer to move stock between warehouses.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={transfers} searchPlaceholder="Search by ID or warehouse..." />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Inter-Warehouse Transfer"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Initiating..." : "Dispatch Transfer"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Source Facility *</label>
              <select
                value={formData.sourceWarehouse}
                onChange={(e) => setFormData({ ...formData, sourceWarehouse: e.target.value })}
                required
              >
                <option value="">Select source warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name || w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Destination Facility *</label>
              <select
                value={formData.destinationWarehouse}
                onChange={(e) => setFormData({ ...formData, destinationWarehouse: e.target.value })}
                required
              >
                <option value="">Select destination warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name || w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
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
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StockTransfersPage;
