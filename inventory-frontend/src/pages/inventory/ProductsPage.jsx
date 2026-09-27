import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Trash2, Tag, Layers } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    sku: "",
    productName: "",
    category: "",
    brand: "",
    unitPrice: "",
    barcode: "",
    safetyStock: 10,
    leadTimeDays: 7,
    averageDailyDemand: 2,
    unit: "PCS",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get("/api/products"),
        api.get("/api/categories"),
        api.get("/api/brands"),
      ]);
      setProducts(prodRes.data?.data || []);
      const cats = catRes.data?.data || [];
      const brs = brandRes.data?.data || [];
      setCategories(cats);
      setBrands(brs);

      if (cats.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: cats[0]._id }));
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load product catalog.",
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
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        sku: formData.sku.trim().toUpperCase(),
        unitPrice: Number(formData.unitPrice),
        safetyStock: Number(formData.safetyStock) || 0,
        leadTimeDays: Number(formData.leadTimeDays) || 7,
        averageDailyDemand: Number(formData.averageDailyDemand) || 0,
      };
      if (!payload.brand) delete payload.brand;
      if (!payload.barcode) delete payload.barcode;

      await api.post("/api/products", payload);
      setToast({ message: "Product created successfully.", type: "success" });
      setIsModalOpen(false);
      setFormData({
        sku: "",
        productName: "",
        category: categories[0]?._id || "",
        brand: "",
        unitPrice: "",
        barcode: "",
        safetyStock: 10,
        leadTimeDays: 7,
        averageDailyDemand: 2,
        unit: "PCS",
      });
      fetchData();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to save product.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate/delete this product?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      setToast({ message: "Product deleted.", type: "success" });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete product.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "Product SKU & Title",
      accessor: "productName",
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>{val}</div>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-primary-700)" }}>
            {row.sku} {row.barcode ? `• 🏷️ ${row.barcode}` : ""}
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      render: (val) => (
        <span style={{ fontSize: "12px", background: "var(--color-slate-100)", padding: "3px 8px", borderRadius: "4px", fontWeight: "600" }}>
          {val?.categoryName || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Brand",
      accessor: "brand",
      render: (val) => <span style={{ color: "var(--color-slate-600)" }}>{val?.brandName || "—"}</span>,
    },
    {
      header: "Unit Price",
      accessor: "unitPrice",
      render: (val) => <span style={{ fontWeight: "700", color: "var(--color-emerald-700)" }}>${Number(val || 0).toFixed(2)}</span>,
    },
    {
      header: "Unit",
      accessor: "unit",
      render: (val) => <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>{val || "PCS"}</span>,
    },
    {
      header: "Lead Time / Safety Stock",
      accessor: "leadTimeDays",
      render: (val, row) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-600)" }}>
          {val || 7}d / {row.safetyStock || 0} min
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
          title="Delete product"
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
          <h1>Product Catalog & Master SKUs</h1>
          <p>Global item definitions, pricing tiers, reorder safety margins, and category attributes</p>
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
            <span>Create Master SKU</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading product catalog from database...
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Products Found</h3>
          <p>Create your first master SKU to start tracking catalog items and warehouse stock.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          searchKey="productName"
          searchPlaceholder="Search product by name or SKU..."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Master SKU"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="product-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save to Catalog"}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleCreate}>
          <div className="form-grid-2">
            <div className="form-field">
              <label>SKU Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. SKU-HEX-008"
              />
            </div>
            <div className="form-field">
              <label>Product Title *</label>
              <input
                type="text"
                required
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g. Stainless Hex Nut M8"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Manufacturer / Brand</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              >
                <option value="">None / Generic</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Unit Selling Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="e.g. 8.99"
              />
            </div>
            <div className="form-field">
              <label>Barcode / GTIN</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g. 8901234567890"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Safety Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={formData.safetyStock}
                onChange={(e) => setFormData({ ...formData, safetyStock: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Lead Time (Days)</label>
              <input
                type="number"
                min="0"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
