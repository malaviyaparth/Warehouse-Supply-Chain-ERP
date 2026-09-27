import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Trash2, Star } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    vendorName: "",
    phone: "",
    email: "",
    address: "",
    rating: 5,
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/vendors");
      setVendors(res.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load vendors.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = formData.vendorName.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();

    if (!name || name.length < 2) {
      setToast({ message: "Vendor entity name must be at least 2 characters.", type: "error" });
      return;
    }

    if (!phone) {
      setToast({ message: "Contact phone/mobile number is required.", type: "error" });
      return;
    }

    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      setToast({
        message: "Mobile number must contain between 10 and 15 digits (e.g. 9876543210 or +15551234567). Letters are not allowed.",
        type: "error",
      });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({ message: "Please enter a valid email address.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/vendors", {
        vendorName: name,
        phone: cleanPhone,
        email: email || undefined,
        address: formData.address.trim() || undefined,
        rating: Number(formData.rating) || 5,
      });
      setToast({ message: "Vendor registered successfully.", type: "success" });
      setIsModalOpen(false);
      setFormData({ vendorName: "", phone: "", email: "", address: "", rating: 5 });
      fetchVendors();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create vendor.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  const handleToggleStatus = async (vendor) => {
    const nextStatus = vendor.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/api/vendors/${vendor._id}`, { status: nextStatus });
      setToast({
        message: `Vendor "${vendor.vendorName}" status changed to ${nextStatus}.`,
        type: "success",
      });
      setVendors((prev) =>
        prev.map((v) => (v._id === vendor._id ? { ...v, status: nextStatus } : v))
      );
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to update vendor status.",
        type: "error",
      });
    }
  };

  const handleDelete = async (vendorOrId, fallbackRow) => {
    const targetId = typeof vendorOrId === "string" ? vendorOrId : (vendorOrId?._id || fallbackRow?._id);
    const targetObj = typeof vendorOrId === "object" ? vendorOrId : fallbackRow;
    const targetName = targetObj?.vendorName || "this vendor";

    if (!targetId) {
      setToast({ message: "Invalid vendor ID for deletion.", type: "error" });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete vendor "${targetName}"?`)) return;

    try {
      const res = await api.delete(`/api/vendors/${targetId}`);
      if (res.data?.deactivated) {
        setToast({
          message: res.data.message || "Vendor has historical transactions and was set to INACTIVE to preserve audit records.",
          type: "warning",
        });
        setVendors((prev) =>
          prev.map((v) => (v._id === targetId ? { ...v, status: "INACTIVE" } : v))
        );
      } else {
        setToast({ message: "Vendor permanently deleted.", type: "success" });
        setVendors((prev) => prev.filter((v) => v._id !== targetId));
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete vendor.",
        type: "error",
      });
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (statusFilter === "ACTIVE") return v.status === "ACTIVE";
    if (statusFilter === "INACTIVE") return v.status === "INACTIVE";
    return true;
  });

  const columns = [
    {
      header: "Vendor Entity",
      accessor: "vendorName",
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>{val}</div>
          <div style={{ fontSize: "12px", color: "var(--color-slate-400)" }}>{row.address || "—"}</div>
        </div>
      ),
    },
    {
      header: "Corporate Email",
      accessor: "email",
      render: (val) => <span style={{ color: "var(--color-primary-700)" }}>{val || "—"}</span>,
    },
    { header: "Phone", accessor: "phone" },
    {
      header: "Quality Score",
      accessor: "rating",
      render: (val) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", color: "var(--color-amber-600)" }}>
          <Star size={13} fill="var(--color-amber-500)" color="var(--color-amber-500)" />
          {val || 5}.0 / 5.0
        </span>
      ),
    },
    {
      header: "Status / Toggle",
      accessor: "status",
      render: (val, row) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(row)}
          title={`Click to set ${val === "ACTIVE" ? "INACTIVE" : "ACTIVE"}`}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span
            className={`badge ${val === "ACTIVE" ? "badge-active" : "badge-inactive"}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: val === "ACTIVE" ? "#10b981" : "#ef4444",
              }}
            />
            {val || "ACTIVE"}
          </span>
        </button>
      ),
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (id, row) => (
        <button
          type="button"
          className="action-icon-btn danger"
          onClick={() => handleDelete(id, row)}
          title={row?.status === "INACTIVE" ? "Delete inactive vendor" : "Delete vendor"}
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Vendor & Supplier Directory</h1>
          <p>Qualified procurement partners, supply contract terms, and supplier performance scorecards</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchVendors}
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
            <span>Onboard Supplier</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", margin: "16px 0" }}>
        {[
          { key: "ALL", label: `All Vendors (${vendors.length})` },
          { key: "ACTIVE", label: `Active (${vendors.filter((v) => v.status === "ACTIVE").length})` },
          { key: "INACTIVE", label: `Inactive / Archived (${vendors.filter((v) => v.status === "INACTIVE").length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className="btn-secondary"
            style={{
              padding: "6px 14px",
              fontSize: "13px",
              borderRadius: "6px",
              backgroundColor: statusFilter === tab.key ? "#2563eb" : "var(--color-slate-100, #f1f5f9)",
              color: statusFilter === tab.key ? "#ffffff" : "var(--color-slate-700, #334155)",
              border: `1px solid ${statusFilter === tab.key ? "#2563eb" : "var(--color-slate-300, #cbd5e1)"}`,
              fontWeight: statusFilter === tab.key ? "600" : "500",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading supplier directory...
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Vendors Found</h3>
          <p>
            {statusFilter === "ALL"
              ? "Onboard your primary vendors and parts suppliers to begin creating purchase orders."
              : `No vendors currently match the "${statusFilter}" status filter.`}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredVendors}
          searchKey="vendorName"
          searchPlaceholder="Filter suppliers by name or email..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard Enterprise Supplier"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="vendor-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Registering..." : "Register Vendor"}
            </button>
          </>
        }
      >
        <form id="vendor-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label>Vendor Entity Name *</label>
            <input
              type="text"
              required
              value={formData.vendorName}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              placeholder="e.g. Acme Industrial Corp"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Contact Phone / Mobile *</label>
              <input
                type="tel"
                inputMode="tel"
                required
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow digits, plus, hyphens, and spaces
                  if (/^[0-9+\s\-()]*$/.test(val)) {
                    setFormData({ ...formData, phone: val });
                  }
                }}
                placeholder="+1 (555) 000-0000 or 9876543210"
              />
              <span style={{ fontSize: "11px", color: "var(--color-slate-500)", marginTop: "2px", display: "block" }}>
                Enter 10 to 15 digits (numbers only, no letters)
              </span>
            </div>
            <div className="form-field">
              <label>Corporate Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@vendor.com"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Location / Facility Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 100 Industrial Blvd, Detroit, MI"
              />
            </div>
            <div className="form-field">
              <label>Initial Quality Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorsPage;
