import React, { useState, useEffect } from "react";
import { Plus, RotateCcw, CheckCircle, RefreshCw, AlertTriangle, ShieldCheck, XCircle } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const ReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // New Return Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    salesOrder: "",
    reason: "",
    condition: "RESTOCKABLE",
    quantity: 1,
    refundAmount: 0,
    remarks: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [retRes, soRes] = await Promise.all([
        axiosInstance.get("/api/returns"),
        axiosInstance.get("/api/sales-orders"),
      ]);

      const retList = retRes.data?.data || retRes.data || [];
      const soList = soRes.data?.data || soRes.data || [];

      setReturns(Array.isArray(retList) ? retList : []);
      setSalesOrders(Array.isArray(soList) ? soList : []);

      if (soList.length > 0 && !formData.salesOrder) {
        setFormData((prev) => ({ ...prev, salesOrder: soList[0]._id }));
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load customer returns.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    if (!formData.salesOrder || !formData.reason) {
      setToast({ type: "error", message: "Sales order and reason are required." });
      return;
    }

    const selectedSO = salesOrders.find((s) => s._id === formData.salesOrder);
    if (!selectedSO || !selectedSO.items?.length) {
      setToast({ type: "error", message: "Selected sales order has no items." });
      return;
    }

    const firstItem = selectedSO.items[0];
    const payload = {
      salesOrder: selectedSO._id,
      customer: selectedSO.customer?._id || selectedSO.customer,
      warehouse: selectedSO.warehouse?._id || selectedSO.warehouse,
      items: [
        {
          product: firstItem.product?._id || firstItem.product,
          quantity: Number(formData.quantity) || 1,
          condition: formData.condition,
        },
      ],
      reason: formData.reason,
      refundAmount: Number(formData.refundAmount) || 0,
      remarks: formData.remarks,
    };

    try {
      setSubmitting(true);
      await axiosInstance.post("/api/returns", payload);
      setToast({ type: "success", message: "RMA return case created successfully." });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to create return.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axiosInstance.put(`/api/returns/${id}/status`, { status });
      setToast({ type: "success", message: `Return status updated to ${status}.` });
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to update return status.",
      });
    }
  };

  const handleCompleteReturn = async (id) => {
    if (!window.confirm("Complete return? This will adjust warehouse inventory and record stock movements.")) {
      return;
    }
    try {
      await axiosInstance.put(`/api/returns/${id}/complete`, { remarks: "Inspected and processed" });
      setToast({ type: "success", message: "Return completed and inventory replenished!" });
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to complete return.",
      });
    }
  };

  const columns = [
    {
      header: "RMA Reference",
      accessor: "returnNumber",
      render: (val, row) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
          {val || `RET-${String(row._id).slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (c) => (
        <span style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
          {c?.customerName || c?.name || "Client"}
        </span>
      ),
    },
    {
      header: "Sales Order",
      accessor: "salesOrder",
      render: (so) => so?.salesOrderNumber || "SO Ref",
    },
    {
      header: "Items Returned",
      accessor: "items",
      render: (items) => (
        <div>
          {items?.map((it, idx) => (
            <div key={idx} style={{ fontSize: "12.5px" }}>
              <strong>{it.product?.productName || "Product"}</strong> &bull; {it.quantity} units ({it.condition})
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Return Reason",
      accessor: "reason",
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => {
        let badgeClass = "badge-pending";
        if (val === "COMPLETED") badgeClass = "badge-active";
        if (val === "APPROVED" || val === "RECEIVED") badgeClass = "badge-info";
        if (val === "REJECTED") badgeClass = "badge-inactive";
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
              style={{ padding: "3px 8px", fontSize: "11px" }}
              onClick={() => handleUpdateStatus(id, "APPROVED")}
            >
              Approve
            </button>
          )}
          {(row.status === "APPROVED" || row.status === "RECEIVED" || row.status === "INSPECTED") && (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: "3px 8px", fontSize: "11px" }}
              onClick={() => handleCompleteReturn(id)}
            >
              Complete & Restock
            </button>
          )}
          {row.status === "REQUESTED" && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "3px 8px", fontSize: "11px", color: "var(--color-rose-600)" }}
              onClick={() => handleUpdateStatus(id, "REJECTED")}
            >
              Reject
            </button>
          )}
          {row.status === "COMPLETED" && (
            <span style={{ fontSize: "12px", color: "var(--color-emerald-700)", fontWeight: "600" }}>
              Settled
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
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Customer RMA & Product Returns</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Return Merchandise Authorization (RMA) tracking, quality quarantine, and automated stock restoration.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Open RMA Case
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Return Cases</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
              <RotateCcw size={20} />
            </div>
          </div>
          <div className="stat-value">{returns.length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Total logged RMAs</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Inspection</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-warning-50)", color: "var(--color-warning-700)" }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value">
            {returns.filter((r) => ["REQUESTED", "APPROVED", "RECEIVED", "INSPECTED"].includes(r.status)).length}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Awaiting restock resolution</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Completed & Restocked</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-success-50)", color: "var(--color-success-700)" }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">{returns.filter((r) => r.status === "COMPLETED").length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Inventory movements created</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading customer RMA returns...
        </div>
      ) : returns.length === 0 ? (
        <div className="empty-state">
          <RotateCcw size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No customer returns recorded</h3>
          <p>Open an RMA case to handle customer returns and manage stock reinstatement.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={returns}
          searchPlaceholder="Search RMA reference or customer..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Open RMA Return Case"
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
              onClick={handleCreateReturn}
              disabled={submitting}
            >
              {submitting ? "Opening..." : "Submit RMA Case"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateReturn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-field">
            <label>Originating Sales Order *</label>
            <select
              value={formData.salesOrder}
              onChange={(e) => setFormData({ ...formData, salesOrder: e.target.value })}
              required
            >
              <option value="">Select sales order...</option>
              {salesOrders.map((so) => (
                <option key={so._id} value={so._id}>
                  {so.salesOrderNumber || `SO-${so._id.slice(-6)}`} - {so.customer?.customerName || so.customer?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Return Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Item Condition *</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                required
              >
                <option value="RESTOCKABLE">RESTOCKABLE (Good Condition)</option>
                <option value="DAMAGED">DAMAGED (Scrap Quarantine)</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Return Reason *</label>
            <textarea
              rows="2"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Defective part or client order specification error."
            />
          </div>

          <div className="form-field">
            <label>Refund Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.refundAmount}
              onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReturnsPage;
