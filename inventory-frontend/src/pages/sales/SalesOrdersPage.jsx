import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ShoppingCart, CheckCircle, PackageCheck, AlertCircle, RefreshCw, FileText, Ban, Truck } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const SalesOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // New Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer: "",
    warehouse: "",
    product: "",
    quantity: 1,
    unitPrice: 0,
    remarks: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [soRes, custRes, whRes, prodRes] = await Promise.all([
        axiosInstance.get("/api/sales-orders"),
        axiosInstance.get("/api/customers"),
        axiosInstance.get("/api/warehouses"),
        axiosInstance.get("/api/products"),
      ]);

      const soData = soRes.data?.data || soRes.data || [];
      const custList = custRes.data?.data || custRes.data || [];
      const whList = whRes.data?.data || whRes.data || [];
      const prodList = prodRes.data?.data || prodRes.data || [];

      setOrders(Array.isArray(soData) ? soData : []);
      setCustomers(Array.isArray(custList) ? custList : []);
      setWarehouses(Array.isArray(whList) ? whList : []);
      setProducts(Array.isArray(prodList) ? prodList : []);

      if (custList.length > 0 && !formData.customer) {
        setFormData((prev) => ({ ...prev, customer: custList[0]._id }));
      }
      if (whList.length > 0 && !formData.warehouse) {
        setFormData((prev) => ({ ...prev, warehouse: whList[0]._id }));
      }
      if (prodList.length > 0 && !formData.product) {
        setFormData((prev) => ({
          ...prev,
          product: prodList[0]._id,
          unitPrice: prodList[0].unitPrice || 0,
        }));
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load sales orders.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductChange = (prodId) => {
    const selected = products.find((p) => p._id === prodId);
    setFormData((prev) => ({
      ...prev,
      product: prodId,
      unitPrice: selected?.unitPrice || 0,
    }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!formData.customer || !formData.warehouse || !formData.product) {
      setToast({ type: "error", message: "Customer, warehouse, and product are required." });
      return;
    }
    if (Number(formData.quantity) <= 0) {
      setToast({ type: "error", message: "Quantity must be greater than zero." });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customer: formData.customer,
        warehouse: formData.warehouse,
        items: [
          {
            product: formData.product,
            quantity: Number(formData.quantity),
            unitPrice: Number(formData.unitPrice),
          },
        ],
        remarks: formData.remarks,
      };

      await axiosInstance.post("/api/sales-orders", payload);
      setToast({ type: "success", message: "Sales order created successfully." });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to create sales order.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserve = async (id) => {
    try {
      await axiosInstance.put(`/api/sales-orders/${id}/reserve`);
      setToast({ type: "success", message: "Stock reserved for sales order." });
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Insufficient warehouse stock to reserve.",
      });
    }
  };

  const handleFulfill = async (id) => {
    if (!window.confirm("Fulfill this order? This will deduct reserved warehouse stock and create STOCK_OUT.")) {
      return;
    }
    try {
      await axiosInstance.put(`/api/sales-orders/${id}/fulfill`);
      setToast({ type: "success", message: "Order fulfilled and stock deducted!" });
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to fulfill sales order.",
      });
    }
  };

  const handleInvoice = async (id) => {
    try {
      const res = await axiosInstance.post(`/api/sales-orders/${id}/invoice`);
      const invData = res.data?.data;
      const invNum = invData?.invoiceNumber || "INV";
      const isExisting = res.data?.alreadyExisted;
      setToast({
        type: "success",
        message: isExisting
          ? `Invoice ${invNum} is already generated for this order. View in Invoices.`
          : `Invoice ${invNum} generated successfully! Check in Invoices tab.`,
      });
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to generate invoice.",
      });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this sales order?")) return;
    try {
      await axiosInstance.put(`/api/sales-orders/${id}/cancel`);
      setToast({ type: "success", message: "Order cancelled." });
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to cancel order.",
      });
    }
  };

  const columns = [
    {
      header: "Order Number",
      accessor: "salesOrderNumber",
      render: (val, row) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
          {val || `SO-${String(row._id).slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (val) => (
        <span style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
          {val?.customerName || val?.name || "Client"}
        </span>
      ),
    },
    {
      header: "Fulfillment Warehouse",
      accessor: "warehouse",
      render: (val) => val?.name || val?.warehouseName || "Warehouse",
    },
    {
      header: "Items",
      accessor: "items",
      render: (items) => (
        <div>
          {items?.map((it, idx) => (
            <div key={idx} style={{ fontSize: "13px" }}>
              {it.product?.productName || "Product"} &times; {it.quantity}
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Contract Amount",
      accessor: "totalAmount",
      render: (val) => <span style={{ fontWeight: "700" }}>${val?.toLocaleString() || 0}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => {
        let badgeClass = "badge-pending";
        if (val === "DELIVERED" || val === "SHIPPED") badgeClass = "badge-active";
        if (val === "CONFIRMED" || val === "PROCESSING" || val === "RESERVED" || val === "FULFILLED") badgeClass = "badge-info";
        if (val === "CANCELLED") badgeClass = "badge-inactive";
        return <span className={`badge ${badgeClass}`}>{val}</span>;
      },
    },
    {
      header: "Invoice Ref",
      accessor: "invoice",
      render: (inv) => {
        if (inv?.invoiceNumber) {
          return (
            <Link
              to="/sales/invoices"
              className="badge badge-active"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
              title="Click to view invoice details"
            >
              <FileText size={11} />
              <span>{inv.invoiceNumber}</span>
            </Link>
          );
        }
        return (
          <span className="badge badge-pending" style={{ opacity: 0.7 }}>
            Not Invoiced
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (id, row) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {row.status === "PENDING" && (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={() => handleReserve(id)}
            >
              Reserve Stock
            </button>
          )}
          {(row.status === "CONFIRMED" || row.status === "PROCESSING" || row.status === "RESERVED") && (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={() => handleFulfill(id)}
            >
              Fulfill / Ship
            </button>
          )}
          {row.status !== "CANCELLED" && (
            row.invoice?.invoiceNumber ? (
              <Link
                to="/sales/invoices"
                className="btn-secondary"
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--color-primary-700)",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
                title="View generated invoice in billing portal"
              >
                <FileText size={12} /> View {row.invoice.invoiceNumber}
              </Link>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                onClick={() => handleInvoice(id)}
              >
                <FileText size={12} /> Generate Invoice
              </button>
            )
          )}
          {(row.status === "FULFILLED" || row.status === "SHIPPED") && (
            <Link
              to="/delivery/assigned"
              className="btn-secondary"
              style={{
                padding: "4px 8px",
                fontSize: "11px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "var(--color-emerald-700)",
                textDecoration: "none",
              }}
              title="Assign delivery route and dispatcher"
            >
              <Truck size={12} /> Dispatch
            </Link>
          )}
          {row.status === "PENDING" && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "4px 8px", fontSize: "11px", color: "var(--color-rose-600)" }}
              onClick={() => handleCancel(id)}
            >
              <Ban size={12} /> Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalValue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Sales Orders & Fulfillment</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Track client contracts, multi-warehouse stock reservation, and real-time inventory fulfillment workflows.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Sales Order
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Orders</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="stat-value">{orders.length}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Recorded client orders</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Reservation / Processing</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-warning-50)", color: "var(--color-warning-700)" }}>
              <PackageCheck size={20} />
            </div>
          </div>
          <div className="stat-value">
            {orders.filter((o) => ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.status)).length}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Active fulfillment pipeline</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Contract Value</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-success-50)", color: "var(--color-success-700)" }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">${totalValue.toLocaleString()}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Across all active sales</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading sales orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No sales orders created</h3>
          <p>Click 'New Sales Order' to register a customer order and reserve stock from designated warehouses.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Search order number or customer..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Sales Order"
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
              onClick={handleCreateOrder}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Save Sales Order"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Customer / Client *</label>
              <select
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                required
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.customerName || c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Fulfillment Warehouse *</label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                required
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name || w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Product *</label>
            <select
              value={formData.product}
              onChange={(e) => handleProductChange(e.target.value)}
              required
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.productName} ({p.sku}) - Price: ${p.unitPrice || 0}
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
              <label>Unit Price ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Order Notes / Terms</label>
            <textarea
              rows="2"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Expedited priority fulfillment requested."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesOrdersPage;
