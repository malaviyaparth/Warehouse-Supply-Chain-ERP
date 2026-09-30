import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ categoryName: "", description: "" });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load categories.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.categoryName) return;
    setSubmitting(true);
    try {
      await api.post("/api/categories", {
        categoryName: formData.categoryName.trim(),
        description: formData.description.trim(),
      });
      setToast({ message: "Category created successfully.", type: "success" });
      setIsModalOpen(false);
      setFormData({ categoryName: "", description: "" });
      fetchCategories();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create category.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/api/categories/${id}`);
      setToast({ message: "Category deleted.", type: "success" });
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete category.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "Category Name",
      accessor: "categoryName",
      render: (val) => <span style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>{val}</span>,
    },
    { header: "Classification Description", accessor: "description", render: (val) => val || "—" },
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
          title="Delete category"
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
          <h1>Product Hierarchy & Categories</h1>
          <p>Multi-tier product taxonomy, grouping codes, and attribute inheritance</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchCategories}
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
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading taxonomy categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Categories Defined</h3>
          <p>Add a product category to organize your warehouse catalog.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          searchKey="categoryName"
          searchPlaceholder="Filter category name..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Product Category"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="cat-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Category"}
            </button>
          </>
        }
      >
        <form id="cat-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label>Category Name *</label>
            <input
              type="text"
              required
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              placeholder="e.g. Pneumatic Tooling"
            />
          </div>

          <div className="form-field">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline which products belong in this category..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
