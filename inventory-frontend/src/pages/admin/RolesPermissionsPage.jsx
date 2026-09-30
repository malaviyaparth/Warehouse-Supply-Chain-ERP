import React, { useState, useEffect } from "react";
import { ShieldCheck, Plus, CheckCircle2, RefreshCw } from "lucide-react";
import Modal from "../../components/common/Modal";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const RolesPermissionsPage = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [newRole, setNewRole] = useState({
    roleName: "",
    description: "",
    permissions: [],
  });

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([
        api.get("/api/roles"),
        api.get("/api/permissions"),
      ]);
      setRoles(roleRes.data?.data || []);
      setPermissions(permRes.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load roles and permissions.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleTogglePermission = (permId) => {
    setNewRole((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((id) => id !== permId)
          : [...prev.permissions, permId],
      };
    });
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRole.roleName) return;
    setSubmitting(true);
    try {
      await api.post("/api/roles", {
        roleName: newRole.roleName.toUpperCase(),
        description: newRole.description,
        permissions: newRole.permissions,
      });
      setToast({ message: "Security role configured successfully.", type: "success" });
      setIsModalOpen(false);
      setNewRole({ roleName: "", description: "", permissions: [] });
      fetchRolesAndPermissions();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create role.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Roles & Permission Matrix</h1>
          <p>Role-based access control (RBAC) governing ERP data authorization</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchRolesAndPermissions}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            <span>Create New Role</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading security roles and permission matrix...
        </div>
      ) : roles.length === 0 ? (
        <div className="empty-state card-panel">
          <ShieldCheck size={36} color="var(--color-slate-400)" />
          <h3>No Security Roles Defined</h3>
          <p>Define an RBAC security role to govern module authorization.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
          {roles.map((r) => {
            const rolePerms = r.permissions || [];
            return (
              <div key={r._id} className="card-panel" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: "6px" }}>
                      <ShieldCheck size={13} />
                      <span>{r.roleName}</span>
                    </span>
                    <div style={{ fontSize: "12px", color: "var(--color-slate-400)", marginTop: "2px" }}>
                      Security Level: Standard Access
                    </div>
                  </div>
                  <div
                    style={{
                      background: r.status === "ACTIVE" ? "var(--color-emerald-50)" : "var(--color-slate-100)",
                      color: r.status === "ACTIVE" ? "var(--color-emerald-700)" : "var(--color-slate-600)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                  >
                    {r.status || "ACTIVE"}
                  </div>
                </div>

                <p style={{ fontSize: "13px", color: "var(--color-slate-600)", lineHeight: 1.5, marginBottom: "16px", flex: 1 }}>
                  {r.description || "Enterprise authorization role."}
                </p>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-slate-400)", marginBottom: "8px", letterSpacing: "0.5px" }}>
                    Active Capabilities ({rolePerms.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {rolePerms.length === 0 ? (
                      <span style={{ fontSize: "12px", color: "var(--color-slate-400)" }}>None assigned</span>
                    ) : (
                      rolePerms.map((p, idx) => (
                        <span
                          key={p._id || idx}
                          style={{
                            fontSize: "11px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "var(--color-slate-100)",
                            color: "var(--color-slate-700)",
                            fontFamily: "monospace",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <CheckCircle2 size={10} color="var(--color-emerald-600)" />
                          {typeof p === "string" ? p : p.permissionName}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Define New ERP Security Role"
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
              form="role-form"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Role"}
            </button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleAddRole}>
          <div className="form-field">
            <label>Role Identifier *</label>
            <input
              type="text"
              required
              value={newRole.roleName}
              onChange={(e) => setNewRole({ ...newRole, roleName: e.target.value })}
              placeholder="e.g. QUALITY_INSPECTOR"
            />
          </div>
          <div className="form-field">
            <label>Scope & Description</label>
            <textarea
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              placeholder="Explain the responsibility of this role..."
            />
          </div>

          {permissions.length > 0 && (
            <div className="form-field">
              <label>Assign Permissions</label>
              <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "8px" }}>
                {permissions.map((p) => (
                  <label key={p._id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", marginBottom: "4px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newRole.permissions.includes(p._id)}
                      onChange={() => handleTogglePermission(p._id)}
                    />
                    <span>{p.permissionName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default RolesPermissionsPage;
