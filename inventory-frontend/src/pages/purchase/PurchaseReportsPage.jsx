import React, { useState, useEffect } from "react";
import { Download, RefreshCw, DollarSign, Calendar, TrendingUp } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const PurchaseReportsPage = () => {
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    totalOrders: 0,
    vendorCount: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, venRes] = await Promise.all([
        api.get("/api/reports/PURCHASE"),
        api.get("/api/vendors"),
      ]);

      const pos = repRes.data?.data || [];
      const vens = venRes.data?.data || [];
      const total = pos.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

      setPurchaseData(pos);
      setMetrics({
        totalSpend: total,
        totalOrders: pos.length,
        vendorCount: vens.length,
      });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load procurement spend analytics.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    if (!purchaseData.length) return;
    const rows = purchaseData.map((po) => ({
      PONumber: po.purchaseOrderNumber,
      Vendor: po.vendor?.vendorName || "Unknown",
      Warehouse: po.warehouse?.warehouseName || "Unknown",
      Status: po.status,
      TotalAmount: po.totalAmount || 0,
      Date: po.createdAt ? new Date(po.createdAt).toISOString() : "",
    }));
    const headers = Object.keys(rows[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h])).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Procurement_Report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: "Procurement report exported.", type: "success" });
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Procurement Spend Analytics</h1>
          <p>Vendor cost distribution, purchase price variances, and procurement commitments</p>
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
          <button type="button" className="btn-primary" onClick={handleExportCSV} disabled={!purchaseData.length}>
            <Download size={15} />
            <span>Export Procurement CSV</span>
          </button>
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          title="Total Procurement Spend"
          value={`$${metrics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="Committed purchase capital"
          trendPositive={true}
          icon={DollarSign}
          colorScheme="indigo"
        />
        <StatCard
          title="Active Contracted Vendors"
          value={`${metrics.vendorCount} Partners`}
          trend="Qualified supplier base"
          trendPositive={true}
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <StatCard
          title="Total Purchase Orders"
          value={metrics.totalOrders}
          trend="Commercial orders generated"
          trendPositive={true}
          icon={Calendar}
          colorScheme="amber"
        />
      </div>

      <div className="card-panel">
        <div className="card-panel-title" style={{ marginBottom: "16px" }}>
          Supplier Purchase Orders Dataset
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
            Computing procurement commitments...
          </div>
        ) : purchaseData.length === 0 ? (
          <div className="empty-state">
            <p>No procurement purchase orders on record yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>PO Reference</th>
                  <th>Vendor / Supplier</th>
                  <th>Delivery Warehouse</th>
                  <th>Status</th>
                  <th>Committed Value</th>
                </tr>
              </thead>
              <tbody>
                {purchaseData.map((po) => (
                  <tr key={po._id}>
                    <td style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
                      {po.purchaseOrderNumber}
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
                      {po.vendor?.vendorName || "—"}
                    </td>
                    <td>{po.warehouse?.warehouseName || "—"}</td>
                    <td>
                      <span className="badge badge-info">{po.status}</span>
                    </td>
                    <td style={{ fontWeight: "700" }}>
                      ${Number(po.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReportsPage;
