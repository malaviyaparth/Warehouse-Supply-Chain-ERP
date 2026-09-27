import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Trash2, MapPin } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    warehouseName: "",
    location: "",
    capacity: 10000,
  });

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/warehouses");
      setWarehouses(res.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load warehouses.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.warehouseName || !formData.location) return;
    setSubmitting(true);
    try {
      await api.post("/api/warehouses", {
        warehouseName: formData.warehouseName.trim(),
        location: formData.location.trim(),
        capacity: Number(formData.capacity) || 5000,
      });
      setToast({ message: "Warehouse registered successfully.", type: "success" });
      setIsModalOpen(false);
      setFormData({ warehouseName: "", location: "", capacity: 10000 });
      fetchWarehouses();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create warehouse.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to decommission this warehouse?")) return;
    try {
      await api.delete(`/api/warehouses/${id}`);
      setToast({ message: "Warehouse removed.", type: "success" });
      setWarehouses((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete warehouse.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "Warehouse Name",
      accessor: "warehouseName",
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>{val}</div>
          <div style={{ fontSize: "12px", color: "var(--color-slate-400)" }}>{row.location}</div>
        </div>
      ),
    },
    {
      header: "Storage Capacity",
      accessor: "capacity",
      render: (val) => <span style={{ fontWeight: "600" }}>{Number(val || 0).toLocaleString()} Bins</span>,
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
          title="Decommission warehouse"
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
          <h1>Storage Facilities & Warehouses</h1>
          <p>Physical distribution sites, storage bin architectures, and facility management</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchWarehouses}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add New Warehouse</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading storage facilities...
        </div>
      ) : warehouses.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Warehouses Registered</h3>
          <p>Commission your first distribution warehouse facility to manage inventory.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={warehouses}
          searchKey="warehouseName"
          searchPlaceholder="Filter facilities by name or location..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Commission New Storage Facility"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="wh-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Registering..." : "Register Warehouse"}
            </button>
          </>
        }
      >
        <form id="wh-form" onSubmit={handleCreate}>
          <div className="form-field">
            <label>Facility Name *</label>
            <input
              type="text"
              required
              value={formData.warehouseName}
              onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
              placeholder="e.g. Midwest Logistics Hub"
            />
          </div>

          <div className="form-field">
            <label>Physical Address / Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. 100 Logistics Pkwy, Chicago, IL"
            />
          </div>

          <div className="form-field">
            <label>Estimated Total Storage Bin Capacity</label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WarehousesPage;
