import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Check, X, FileText } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    vendor: "",
    warehouse: "",
    product: "",
    quantity: 100,
    unitPrice: 10,
    expectedDate: "",
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poRes, venRes, whRes, prodRes] = await Promise.all([
        api.get("/api/purchases"),
        api.get("/api/vendors"),
        api.get("/api/warehouses"),
        api.get("/api/products"),
      ]);

      setOrders(poRes.data?.data || []);
      const vList = venRes.data?.data || [];
      const wList = whRes.data?.data || [];
      const pList = prodRes.data?.data || [];
      setVendors(vList);
      setWarehouses(wList);
      setProducts(pList);

      if (vList.length > 0 && !formData.vendor) {
        setFormData((prev) => ({
          ...prev,
          vendor: vList[0]._id,
          warehouse: wList[0]?._id || "",
          product: pList[0]?._id || "",
          unitPrice: pList[0]?.unitPrice || 10,
        }));
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load purchase orders.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductChange = (prodId) => {
    const prod = products.find((p) => p._id === prodId);
    setFormData((prev) => ({
      ...prev,
      product: prodId,
      unitPrice: prod?.unitPrice || prev.unitPrice,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.vendor || !formData.warehouse || !formData.product || formData.quantity <= 0) return;
    setSubmitting(true);
    try {
      await api.post("/api/purchases", {
        vendor: formData.vendor,
        warehouse: formData.warehouse,
        items: [
          {
            product: formData.product,
            quantity: Number(formData.quantity),
            unitPrice: Number(formData.unitPrice),
          },
        ],
        expectedDate: formData.expectedDate || undefined,
        remarks: formData.remarks || "Direct purchase order",
      });

      setToast({ message: "Purchase order created successfully.", type: "success" });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create PO.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/purchases/${id}/approve`);
      setToast({ message: "Purchase order approved.", type: "success" });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to approve PO.",
        type: "error",
      });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this purchase order?")) return;
    try {
      await api.put(`/api/purchases/${id}/cancel`);
      setToast({ message: "Purchase order cancelled.", type: "success" });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to cancel PO.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "PO Reference",
      accessor: "purchaseOrderNumber",
      render: (val) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>{val}</span>
      ),
    },
    {
      header: "Supplier Vendor",
      accessor: "vendor",
      render: (val) => (
        <span style={{ fontWeight: "600", color: "var(--color-slate-800)" }}>
          {val?.vendorName || "—"}
        </span>
      ),
    },
    {
      header: "Receiving Warehouse",
      accessor: "warehouse",
      render: (val) => val?.warehouseName || "—",
    },
    {
      header: "Items Ordered",
      accessor: "items",
      render: (items) => (
        <div>
          {items?.map((it, idx) => (
            <div key={idx} style={{ fontSize: "12.5px" }}>
              {it.product?.productName || "Product"} &bull; <strong>{it.receivedQuantity || 0}/{it.quantity} Recv</strong>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Total Value",
      accessor: "totalAmount",
      render: (val) => (
        <span style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>
          ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span
          className={`badge ${
            val === "RECEIVED"
              ? "badge-active"
              : val === "APPROVED"
              ? "badge-info"
              : val === "PARTIALLY_RECEIVED"
              ? "badge-pending"
              : val === "CANCELLED"
              ? "badge-inactive"
              : "badge-draft"
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (id, row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          {row.status === "PENDING" && (
            <button
              type="button"
              className="action-icon-btn"
              style={{ color: "var(--color-emerald-600)" }}
              onClick={() => handleApprove(id)}
              title="Approve PO"
            >
              <Check size={16} />
            </button>
          )}
          {row.status !== "RECEIVED" && row.status !== "CANCELLED" && (
            <button
              type="button"
              className="action-icon-btn danger"
              onClick={() => handleCancel(id)}
              title="Cancel PO"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Purchase Orders Registry</h1>
          <p>Commercial commitments, supplier PO dispatches, and receiving status</p>
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
            <span>Generate Purchase Order</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading purchase orders from database...
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Purchase Orders Found</h3>
          <p>Generate a purchase order to initiate procurement with your qualified suppliers.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          searchKey="purchaseOrderNumber"
          searchPlaceholder="Search by PO number..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft New Supplier Purchase Order"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="po-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Issuing..." : "Issue PO"}
            </button>
          </>
        }
      >
        <form id="po-form" onSubmit={handleCreate}>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Vendor / Supplier *</label>
              <select
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                required
              >
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vendorName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Delivery Warehouse *</label>
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
          </div>

          <div className="form-field">
            <label>Item SKU to Procure *</label>
            <select
              value={formData.product}
              onChange={(e) => handleProductChange(e.target.value)}
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
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Agreed Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Expected Delivery Date</label>
            <input
              type="date"
              value={formData.expectedDate}
              onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrdersPage;
