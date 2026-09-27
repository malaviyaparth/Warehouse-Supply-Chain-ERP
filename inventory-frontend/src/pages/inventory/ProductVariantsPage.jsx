import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Trash2, Tag } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const ProductVariantsPage = () => {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    product: "",
    variantName: "Size",
    variantValue: "",
    sku: "",
    additionalPrice: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [varRes, prodRes] = await Promise.all([
        api.get("/api/product-variants"),
        api.get("/api/products"),
      ]);
      setVariants(varRes.data?.data || []);
      const prods = prodRes.data?.data || [];
      setProducts(prods);
      if (prods.length > 0 && !formData.product) {
        setFormData((prev) => ({ ...prev, product: prods[0]._id }));
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load product variants.",
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
    if (!formData.product || !formData.variantValue) return;
    setSubmitting(true);
    try {
      await api.post("/api/product-variants", {
        product: formData.product,
        variantName: formData.variantName.trim(),
        variantValue: formData.variantValue.trim(),
        sku: formData.sku.trim().toUpperCase() || undefined,
        additionalPrice: Number(formData.additionalPrice) || 0,
      });
      setToast({ message: "Product variant created.", type: "success" });
      setIsModalOpen(false);
      setFormData({
        product: products[0]?._id || "",
        variantName: "Size",
        variantValue: "",
        sku: "",
        additionalPrice: 0,
      });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create variant.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this variant?")) return;
    try {
      await api.delete(`/api/product-variants/${id}`);
      setToast({ message: "Variant deleted.", type: "success" });
      setVariants((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete variant.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "Variant SKU",
      accessor: "sku",
      render: (val) => (
        <span style={{ fontFamily: "monospace", fontWeight: "700", color: "var(--color-primary-700)" }}>
          {val || "—"}
        </span>
      ),
    },
    {
      header: "Parent Product",
      accessor: "product",
      render: (val) => (
        <div>
          <div style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
            {val?.productName || "Product"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-slate-400)" }}>
            {val?.sku}
          </div>
        </div>
      ),
    },
    {
      header: "Variant Specification",
      accessor: "variantName",
      render: (val, row) => (
        <span style={{ fontWeight: "600", color: "var(--color-slate-800)" }}>
          {val}: {row.variantValue}
        </span>
      ),
    },
    {
      header: "Price Delta",
      accessor: "additionalPrice",
      render: (val) => (
        <span style={{ color: "var(--color-emerald-700)", fontWeight: "600" }}>
          +${Number(val || 0).toFixed(2)}
        </span>
      ),
    },
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
          title="Delete variant"
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
          <h1>Product Variants Matrix</h1>
          <p>Dimensional specifications, sizes, colors, and variant child SKU associations</p>
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
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            <span>Add SKU Variant</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading product variants...
        </div>
      ) : variants.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Product Variants Created</h3>
          <p>Register variant specifications (e.g. sizes, colors) for your base catalog SKUs.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={variants}
          searchKey="sku"
          searchPlaceholder="Filter by variant SKU or attribute..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Child SKU Variant"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="var-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Variant"}
            </button>
          </>
        }
      >
        <form id="var-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label>Parent Master Product *</label>
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
              <label>Attribute Dimension *</label>
              <select
                value={formData.variantName}
                onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
              >
                <option value="Size">Size</option>
                <option value="Color">Color</option>
                <option value="Material">Material</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
            <div className="form-field">
              <label>Attribute Value *</label>
              <input
                type="text"
                required
                value={formData.variantValue}
                onChange={(e) => setFormData({ ...formData, variantValue: e.target.value })}
                placeholder="e.g. 50mm or Metallic Blue"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Unique Variant SKU Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. SKU-STL-001-50MM"
              />
            </div>
            <div className="form-field">
              <label>Price Delta ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.additionalPrice}
                onChange={(e) => setFormData({ ...formData, additionalPrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductVariantsPage;
