import React, { useState, useEffect } from "react";
import { Receipt, DollarSign, CheckCircle, RefreshCw, AlertCircle, CreditCard } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/invoices");
      const list = res.data?.data || res.data || [];
      setInvoices(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load invoices.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentMethod("BANK_TRANSFER");
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setSubmitting(true);
      await axiosInstance.put(`/api/invoices/${selectedInvoice._id}/payment`, {
        paymentStatus: "PAID",
        paymentMethod,
      });

      setToast({ type: "success", message: "Payment recorded successfully." });
      setIsPaymentModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to record payment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: "Invoice Reference",
      accessor: "invoiceNumber",
      render: (val, row) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
          {val || `INV-${String(row._id).slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: "Sales Order",
      accessor: "salesOrder",
      render: (so) => <span style={{ fontWeight: "600" }}>{so?.salesOrderNumber || "SO Ref"}</span>,
    },
    {
      header: "Client Account",
      accessor: "salesOrder",
      render: (so) => (
        <span style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
          {so?.customer?.customerName || so?.customer?.name || "Client Account"}
        </span>
      ),
    },
    {
      header: "Billing Date",
      accessor: "invoiceDate",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      header: "Invoice Amount",
      accessor: "totalAmount",
      render: (val) => <span style={{ fontWeight: "700" }}>${val?.toLocaleString() || 0}</span>,
    },
    {
      header: "Payment Method",
      accessor: "paymentMethod",
      render: (val) => val || "—",
    },
    {
      header: "Payment Status",
      accessor: "paymentStatus",
      render: (val) => {
        let badgeClass = "badge-pending";
        if (val === "PAID") badgeClass = "badge-active";
        if (val === "OVERDUE") badgeClass = "badge-inactive";
        if (val === "PARTIALLY_PAID") badgeClass = "badge-warning";
        return <span className={`badge ${badgeClass}`}>{val}</span>;
      },
    },
    {
      header: "Action",
      accessor: "_id",
      render: (id, row) =>
        row.paymentStatus !== "PAID" ? (
          <button
            type="button"
            className="btn-primary"
            style={{ padding: "4px 8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
            onClick={() => openPaymentModal(row)}
          >
            <CreditCard size={13} /> Settle Payment
          </button>
        ) : (
          <span style={{ fontSize: "12px", color: "var(--color-emerald-700)", fontWeight: "600" }}>
            Settled
          </span>
        ),
    },
  ];

  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.paymentStatus === "PAID");
  const totalCollected = paidInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Invoices & Accounts Receivable</h1>
          <p style={{ color: "var(--color-slate-500)", marginTop: "4px", fontSize: "14px" }}>
            Commercial tax invoices generated automatically upon sales order fulfillment, payment reconciliation, and aging.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchInvoices} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Invoiced Volume</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
              <Receipt size={20} />
            </div>
          </div>
          <div className="stat-value">${totalInvoiced.toLocaleString()}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>{invoices.length} invoices generated</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Collected Revenue</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-success-50)", color: "var(--color-success-700)" }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">${totalCollected.toLocaleString()}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>{paidInvoices.length} paid invoices</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Outstanding Receivables</span>
            <div className="stat-icon-wrapper" style={{ background: "var(--color-warning-50)", color: "var(--color-warning-700)" }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value">${(totalInvoiced - totalCollected).toLocaleString()}</div>
          <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>Pending client collections</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading invoice ledgers...
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <Receipt size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No invoices recorded</h3>
          <p>Generate invoices directly from Sales Orders upon order confirmation or fulfillment.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          searchPlaceholder="Search invoice number or sales order..."
        />
      )}

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Settle Invoice - ${selectedInvoice?.invoiceNumber || "Record Payment"}`}
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleRecordPayment}
              disabled={submitting}
            >
              {submitting ? "Settling..." : "Confirm Payment"}
            </button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "12px", background: "var(--color-slate-50)", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", color: "var(--color-slate-600)" }}>
              Amount Due: <strong style={{ fontSize: "16px", color: "var(--color-slate-900)" }}>${selectedInvoice?.totalAmount?.toLocaleString()}</strong>
            </div>
          </div>

          <div className="form-field">
            <label>Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              <option value="BANK_TRANSFER">Bank Transfer (Wire / ACH)</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / Digital Wallet</option>
              <option value="CREDIT">Corporate Credit</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoicesPage;
