import React, { useState, useEffect } from "react";
import { History, Download, RefreshCw } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const InventoryHistoryPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/stock-movements");
      setMovements(res.data?.data || []);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load stock movement ledger.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const handleExportCSV = () => {
    if (!movements.length) return;
    const rows = movements.map((m) => ({
      Timestamp: m.createdAt ? new Date(m.createdAt).toISOString() : "",
      SKU: m.product?.sku || "",
      Product: m.product?.productName || "",
      Type: m.type,
      Quantity: m.quantity,
      Warehouse: m.warehouse?.warehouseName || "",
      PreviousQuantity: m.previousQuantity,
      NewQuantity: m.newQuantity,
      ReferenceType: m.referenceType,
    }));
    const headers = Object.keys(rows[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h])).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Stock_Movements_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: "Stock movement ledger exported.", type: "success" });
  };

  const columns = [
    {
      header: "Timestamp",
      accessor: "createdAt",
      render: (val) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
          {val ? new Date(val).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      header: "Movement Type",
      accessor: "type",
      render: (val) => (
        <span
          className={`badge ${
            val?.includes("IN")
              ? "badge-active"
              : val?.includes("OUT")
              ? "badge-inactive"
              : val?.includes("TRANSFER")
              ? "badge-info"
              : "badge-pending"
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      header: "Product Item",
      accessor: "product",
      render: (val) => (
        <div>
          <div style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
            {val?.productName || "Product Item"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-slate-400)" }}>
            {val?.sku}
          </div>
        </div>
      ),
    },
    {
      header: "Quantity Delta",
      accessor: "quantity",
      render: (val, row) => {
        const isDeduction =
          row.type === "STOCK_OUT" || row.type === "TRANSFER_OUT" || row.type === "DAMAGED";
        return (
          <span
            style={{
              fontWeight: "800",
              color: isDeduction ? "var(--color-rose-600)" : "var(--color-emerald-600)",
            }}
          >
            {isDeduction ? `-${val}` : `+${val}`} Units
          </span>
        );
      },
    },
    {
      header: "Facility",
      accessor: "warehouse",
      render: (val) => val?.warehouseName || "—",
    },
    {
      header: "Balance Transition",
      accessor: "newQuantity",
      render: (val, row) => (
        <span style={{ fontSize: "12px", color: "var(--color-slate-600)" }}>
          {row.previousQuantity} &rarr; <strong>{val}</strong>
        </span>
      ),
    },
    {
      header: "Reference",
      accessor: "referenceType",
      render: (val) => <span style={{ fontWeight: "600" }}>{val || "MANUAL"}</span>,
    },
  ];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Stock Movement Ledger & History</h1>
          <p>Chronological immutable journal of stock inbounds, customer deductions, and adjustments</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchMovements}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button type="button" className="btn-secondary" onClick={handleExportCSV} disabled={!movements.length}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading stock movement ledger...
        </div>
      ) : movements.length === 0 ? (
        <div className="empty-state card-panel">
          <h3>No Movements Recorded Yet</h3>
          <p>Stock intakes, deductions, and transfer events will be logged here chronologically.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={movements}
          searchKey="type"
          searchPlaceholder="Search by type or reference..."
          filterKey="type"
          filterOptions={[
            { label: "Stock In", value: "STOCK_IN" },
            { label: "Stock Out", value: "STOCK_OUT" },
            { label: "Adjustment", value: "ADJUSTMENT" },
            { label: "Transfer In", value: "TRANSFER_IN" },
            { label: "Transfer Out", value: "TRANSFER_OUT" },
            { label: "Return In", value: "RETURN_IN" },
            { label: "Damaged", value: "DAMAGED" },
          ]}
        />
      )}
    </div>
  );
};

export default InventoryHistoryPage;
