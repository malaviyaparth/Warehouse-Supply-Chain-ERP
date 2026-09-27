import React, { useState, useEffect } from "react";
import { History, Download, CheckCircle2, MapPin, RefreshCw } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const DeliveryHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/deliveries/history");
      const list = res.data?.data || [];
      setHistory(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load delivery history archive.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExportCSV = () => {
    if (history.length === 0) {
      setToast({ type: "error", message: "No historical delivery records to export." });
      return;
    }
    const headers = "Waybill,Client,Address,Driver,Warehouse,Status,Delivered At,Remarks\n";
    const rows = history
      .map(
        (h) =>
          `"${h.deliveryNumber || ""}","${h.customer?.customerName || ""}","${h.deliveryAddress || ""}","${
            h.assignedEmployee?.fullName || h.assignedEmployee?.name || ""
          }","${h.warehouse?.name || h.warehouse?.warehouseName || ""}","${h.status || ""}","${
            h.deliveredAt || ""
          }","${h.remarks || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `delivery-history-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: "success", message: "Delivery archive exported to CSV." });
  };

  const columns = [
    {
      header: "Waybill Reference",
      accessor: "deliveryNumber",
      render: (val, row) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
          {val || `DEL-${String(row._id).slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: "Completion Timestamp",
      accessor: "deliveredAt",
      render: (val, row) => (
        <span style={{ fontSize: "12.5px", color: "var(--color-slate-600)" }}>
          {val ? new Date(val).toLocaleString() : new Date(row.updatedAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Consignee & Site",
      accessor: "customer",
      render: (c, row) => (
        <div>
          <div style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
            {c?.customerName || c?.name || "Client"}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--color-slate-400)", display: "flex", alignItems: "center", gap: "3px" }}>
            <MapPin size={11} />
            {row.deliveryAddress || c?.address || "Address"}
          </div>
        </div>
      ),
    },
    {
      header: "Sales Order",
      accessor: "salesOrder",
      render: (so) => so?.salesOrderNumber || "SO Ref",
    },
    {
      header: "Fleet Driver",
      accessor: "assignedEmployee",
      render: (emp) => emp?.fullName || emp?.name || "Driver",
    },
    {
      header: "e-POD / Remarks",
      accessor: "remarks",
      render: (val, row) => (
        <span
          style={{
            fontSize: "11.5px",
            color: row.status === "DELIVERED" ? "var(--color-emerald-700)" : "var(--color-rose-700)",
            fontWeight: "600",
            background: row.status === "DELIVERED" ? "var(--color-emerald-50)" : "var(--color-rose-50)",
            padding: "3px 8px",
            borderRadius: "4px",
          }}
        >
          {val || (row.status === "DELIVERED" ? "Electronic POD Verified" : row.failureReason || "Exception logged")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span className={`badge ${val === "DELIVERED" ? "badge-active" : "badge-inactive"}`}>
          {val}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Historical Delivery Logs & e-PODs</h1>
          <p>Archived delivery manifests, signed proofs of delivery, and driver completion logs</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={fetchHistory} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button type="button" className="btn-primary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export Delivery Archive</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading historical delivery archive...
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <History size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No historical deliveries</h3>
          <p>Completed and closed deliveries will be archived here with electronic proof of delivery.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={history}
          searchPlaceholder="Filter completed deliveries by client..."
        />
      )}
    </div>
  );
};

export default DeliveryHistoryPage;
