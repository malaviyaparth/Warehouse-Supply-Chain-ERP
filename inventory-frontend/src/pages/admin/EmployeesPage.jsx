import React, { useState, useEffect } from "react";
import { UserPlus, Shield, Trash2, RefreshCw } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "ADMIN",
    role: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState(null);

  const fetchEmployeesAndRoles = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [empRes, roleRes] = await Promise.all([
        api.get("/api/employees"),
        api.get("/api/roles"),
      ]);
      setEmployees(empRes.data?.data || []);
      const roleData = roleRes.data?.data || [];
      setRoles(roleData);
      if (roleData.length > 0 && !formData.role) {
        setFormData((prev) => ({ ...prev, role: roleData[0]._id }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to load workforce directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndRoles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/employees", formData);
      setToast({ message: "Employee registered successfully!", type: "success" });
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        department: "ADMIN",
        role: roles[0]?._id || "",
        phone: "",
        password: "",
      });
      fetchEmployeesAndRoles();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create employee.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this employee?")) return;
    try {
      await api.delete(`/api/employees/${id}`);
      setToast({ message: "Employee removed successfully.", type: "success" });
      setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to delete employee.",
        type: "error",
      });
    }
  };

  const columns = [
    {
      header: "Employee Name",
      accessor: "name",
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>{val}</div>
          <div style={{ fontSize: "12px", color: "var(--color-slate-400)" }}>{row.email}</div>
        </div>
      ),
    },
    {
      header: "Department",
      accessor: "department",
      render: (val) => (
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "var(--color-slate-700)",
            background: "var(--color-slate-100)",
            padding: "3px 8px",
            borderRadius: "4px",
          }}
        >
          {val || "GENERAL"}
        </span>
      ),
    },
    {
      header: "Assigned Role",
      accessor: "role",
      render: (roleObj) => (
        <span className="badge badge-info">
          <Shield size={12} />
          <span>{roleObj?.roleName || "No Role"}</span>
        </span>
      ),
    },
    {
      header: "Phone",
      accessor: "phone",
      render: (val) => <span style={{ color: "var(--color-slate-600)" }}>{val || "—"}</span>,
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
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            className="action-icon-btn danger"
            onClick={() => handleDeleteEmployee(id)}
            title="Deactivate employee"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Employee Workforce Directory</h1>
          <p>Provision staff accounts, assign departmental roles, and enforce security policies</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchEmployeesAndRoles}
            disabled={loading}
            title="Refresh employees"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="login-error" style={{ marginBottom: "16px" }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading employee records...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          searchKey="name"
          searchPlaceholder="Filter by name, email, department..."
          filterKey="department"
          filterOptions={[
            { label: "Admin", value: "ADMIN" },
            { label: "Purchase", value: "PURCHASE" },
            { label: "Warehouse", value: "WAREHOUSE" },
            { label: "Inventory", value: "INVENTORY" },
            { label: "Sales", value: "SALES" },
            { label: "Delivery", value: "DELIVERY" },
          ]}
        />
      )}

      {/* Register Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Enterprise Employee"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="employee-form"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? "Registering..." : "Create Account"}
            </button>
          </>
        }
      >
        <form id="employee-form" onSubmit={handleCreateEmployee}>
          <div className="form-grid-2">
            <div className="form-field">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="form-field">
              <label>Corporate Email *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.doe@erp.com"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="PURCHASE">PURCHASE</option>
                <option value="WAREHOUSE">WAREHOUSE</option>
                <option value="INVENTORY">INVENTORY</option>
                <option value="SALES">SALES</option>
                <option value="DELIVERY">DELIVERY</option>
              </select>
            </div>
            <div className="form-field">
              <label>Role Assignment *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Contact Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="form-field">
              <label>Initial Password *</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;
