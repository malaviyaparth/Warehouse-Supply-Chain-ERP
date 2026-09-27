import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Check, X, ShoppingCart } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const PurchaseRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    product: "",
    warehouse: "",
    quantity: 50,
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prRes, prodRes, whRes] = await Promise.all([
        api.get("/api/purchase-requests"),
        api.get("/api/products"),
        api.get("/api/warehouses"),
      ]);

      setRequests(prRes.data?.data || []);
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
        message: err.response?.data?.message || "Failed to load purchase requests.",
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
      const selectedProd = products.find((p) => p._id === formData.product);
      await api.post("/api/purchase-requests", {
        warehouse: formData.warehouse,
        items: [
          {
            product: formData.product,
            quantity: Number(formData.quantity),
            estimatedUnitPrice: selectedProd?.unitPrice || 0,
          },
        ],
        reason: "MANUAL",
        remarks: formData.remarks || "Requisition submitted via portal",
      });

      setToast({ message: "Purchase request submitted for approval.", type: "success" });
      setIsModalOpen(false);
      setFormData({
        product: products[0]?._id || "",
        warehouse: warehouses[0]?._id || "",
        quantity: 50,
        remarks: "",
      });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to submit request.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/purchase-requests/${id}/approve`);
      setToast({ message: "Purchase request approved.", type: "success" });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to approve request.",
        type: "error",
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/api/purchase-requests/${id}/reject`);
      setToast({ message: "Purchase request rejected.", type: "success" });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to reject request.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "Request Number",
      accessor: "requestNumber",
      render: (val) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>{val}</span>
      ),
    },
    {
      header: "Target Facility",
      accessor: "warehouse",
      render: (val) => val?.warehouseName || "—",
    },
    {
      header: "Requested Items",
      accessor: "items",
      render: (items) => (
        <div>
          {items?.map((it, idx) => (
            <div key={idx} style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-slate-800)" }}>
              {it.product?.productName || "Product"} &bull; <strong>{it.quantity} Pcs</strong>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Requisition Reason",
      accessor: "reason",
      render: (val) => (
        <span
          className={`badge ${
            val === "LOW_STOCK" ? "badge-inactive" : "badge-info"
          }`}
        >
          {val === "LOW_STOCK" ? "Automated ROP Trigger" : "Manual Request"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span
          className={`badge ${
            val === "APPROVED"
              ? "badge-active"
              : val === "REJECTED"
              ? "badge-inactive"
              : val === "CONVERTED"
              ? "badge-info"
              : "badge-pending"
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      header: "Date Requested",
      accessor: "createdAt",
      render: (val) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
          {val ? new Date(val).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (id, row) =>
        row.status === "PENDING" ? (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className="action-icon-btn"
              style={{ color: "var(--color-emerald-600)" }}
              onClick={() => handleApprove(id)}
              title="Approve Requisition"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              className="action-icon-btn danger"
              onClick={() => handleReject(id)}
              title="Reject Requisition"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <span style={{ fontSize: "12px", color: "var(--color-slate-400)" }}>Finalized</span>
        ),
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Purchase Requisitions & Demands</h1>
          <p>Internal supply requests from warehouse, inventory, and sales departments</p>
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
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>New Purchase Request</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading purchase requisitions...
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Requisitions Found</h3>
          <p>Submit a purchase demand or let the low-stock cron generate automated replenishment triggers.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          searchKey="requestNumber"
          searchPlaceholder="Search requisition by request number..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit New Purchase Requisition"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="pr-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </>
        }
      >
        <form id="pr-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label>Catalog Product Item *</label>
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

          <div className="form-grid-2">
            <div className="form-field">
              <label>Target Warehouse *</label>
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
              <label>Required Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Justification & Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="State reason for procurement requisition..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseRequestsPage;
