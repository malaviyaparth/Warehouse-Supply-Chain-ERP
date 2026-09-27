import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const BrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ brandName: "", description: "" });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/brands");
      setBrands(res.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load brands.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.brandName) return;
    setSubmitting(true);
    try {
      await api.post("/api/brands", {
        brandName: formData.brandName.trim(),
        description: formData.description.trim(),
      });
      setToast({ message: "Brand created successfully.", type: "success" });
      setIsModalOpen(false);
      setFormData({ brandName: "", description: "" });
      fetchBrands();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create brand.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    try {
      await api.delete(`/api/brands/${id}`);
      setToast({ message: "Brand deleted.", type: "success" });
      setBrands((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete brand.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "Brand Name",
      accessor: "brandName",
      render: (val) => <span style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>{val}</span>,
    },
    { header: "Description", accessor: "description", render: (val) => val || "—" },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span className={`badge ${val === "ACTIVE" ? "badge-active" : "badge-inactive"}`}>
          {val || "ACTIVE"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (id) => (
        <button
          type="button"
          className="action-icon-btn danger"
          onClick={() => handleDelete(id)}
          title="Delete brand"
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
          <h1>Manufacturers & Brands</h1>
          <p>OEM manufacturer records, supplier brand identities, and product lines</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchBrands}
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
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading brands directory...
        </div>
      ) : brands.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Brands Found</h3>
          <p>Add brand manufacturers to associate with your catalog SKUs.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={brands}
          searchKey="brandName"
          searchPlaceholder="Filter brands by name..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Brand Manufacturer"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="brand-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Brand"}
            </button>
          </>
        }
      >
        <form id="brand-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label>Brand Name *</label>
            <input
              type="text"
              required
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              placeholder="e.g. Bosch Rexroth"
            />
          </div>

          <div className="form-field">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brand details or OEM specifications..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BrandsPage;
