import React, { useState, useEffect } from "react";
import { PackageCheck, RefreshCw } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const GoodsReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/goods-receipts");
      setReceipts(res.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load goods receipts.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const columns = [
    {
      header: "GRN Reference",
      accessor: "_id",
      render: (val) => (
        <span style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
          GRN-{String(val).slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      header: "PO Reference",
      accessor: "purchaseOrder",
      render: (val) => (
        <span style={{ fontWeight: "600" }}>{val?.purchaseOrderNumber || "PO Reference"}</span>
      ),
    },
    {
      header: "Receiving Facility",
      accessor: "warehouse",
      render: (val) => val?.warehouseName || "—",
    },
    {
      header: "Items Intake Details",
      accessor: "items",
      render: (items) => (
        <div>
          {items?.map((it, idx) => (
            <div key={idx} style={{ fontSize: "12.5px" }}>
              {it.product?.productName || "Product"} &bull;{" "}
              <strong style={{ color: "var(--color-emerald-600)" }}>+{it.receivedQuantity} Units</strong>
              {it.damagedQuantity > 0 && (
                <span style={{ color: "var(--color-rose-600)", marginLeft: "6px" }}>
                  ({it.damagedQuantity} damaged)
                </span>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Intake Date",
      accessor: "receiptDate",
      render: (val) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
          {val ? new Date(val).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      header: "Verified By",
      accessor: "receivedBy",
      render: (val) => val?.name || "Dock Staff",
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Goods Receipt Notes (GRN)</h1>
          <p>Inbound dock receipt logs, physical count verification, and delivery acceptance manifests</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchReceipts}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading goods receipts from database...
        </div>
      ) : receipts.length === 0 ? (
        <div className="empty-state card-panel">
          <PackageCheck size={36} color="var(--color-slate-400)" />
          <h3>No Goods Receipt Notes Recorded</h3>
          <p>When approved purchase orders are received at warehouse docks, verified GRNs will appear here.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={receipts}
          searchKey="_id"
          searchPlaceholder="Search goods receipts..."
        />
      )}
    </div>
  );
};

export default GoodsReceiptsPage;
