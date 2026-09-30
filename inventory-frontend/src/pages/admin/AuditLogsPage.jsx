import React, { useState, useEffect } from "react";
import { Shield, RefreshCw } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/audit-logs");
      setLogs(res.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load audit logs.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      header: "Timestamp",
      accessor: "timestamp",
      render: (val) => (
        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--color-slate-600)" }}>
          {val ? new Date(val).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      header: "Operator / Employee",
      accessor: "employee",
      render: (val) => (
        <div>
          <div style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
            {val?.name || "System Service"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-slate-400)" }}>
            {val?.email || "internal@system"}
          </div>
        </div>
      ),
    },
    {
      header: "Action Trigger",
      accessor: "action",
      render: (val) => (
        <span
          style={{
            fontSize: "12px",
            fontWeight: "700",
            color: "var(--color-slate-800)",
            background: "var(--color-slate-100)",
            padding: "3px 8px",
            borderRadius: "4px",
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: "Entity Scope",
      accessor: "entityType",
      render: (val, row) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-600)", fontWeight: "500" }}>
          {val} {row.entityId ? `(#${String(row.entityId).slice(-6)})` : ""}
        </span>
      ),
    },
    {
      header: "Event Details",
      accessor: "description",
      render: (val) => (
        <span style={{ fontSize: "12.5px", color: "var(--color-slate-600)" }}>
          {val || "Audit trail captured"}
        </span>
      ),
    },
    {
      header: "Origin IP",
      accessor: "ipAddress",
      render: (val) => (
        <span style={{ fontFamily: "monospace", fontSize: "11.5px", color: "var(--color-slate-500)" }}>
          {val || "127.0.0.1"}
        </span>
      ),
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Security & System Audit Logs</h1>
          <p>Immutable audit trail of authentication attempts, administrative changes, and transactions</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading system audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state card-panel">
          <Shield size={36} color="var(--color-slate-400)" />
          <h3>No Audit Records Logged Yet</h3>
          <p>Important security, inventory, and order operations will automatically record here.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          searchKey="action"
          searchPlaceholder="Search by action, entity type, description..."
        />
      )}
    </div>
  );
};

export default AuditLogsPage;
