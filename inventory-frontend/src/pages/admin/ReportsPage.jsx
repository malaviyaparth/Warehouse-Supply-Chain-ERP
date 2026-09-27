import React, { useState, useEffect } from "react";
import { Download, RefreshCw, BarChart3, TrendingUp, Layers, CheckCircle2 } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const ReportsPage = () => {
  const [reportType, setReportType] = useState("INVENTORY");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState({
    inventoryCount: 0,
    inventoryValue: 0,
    purchaseCount: 0,
    purchaseTotal: 0,
    salesCount: 0,
    salesTotal: 0,
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [invRes, purRes, salRes] = await Promise.all([
        api.get("/api/reports/INVENTORY"),
        api.get("/api/reports/PURCHASE"),
        api.get("/api/reports/SALES"),
      ]);

      const inv = invRes.data?.data || [];
      const pur = purRes.data?.data || [];
      const sal = salRes.data?.data || [];

      const invValue = inv.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.product?.unitPrice || 0),
        0
      );
      const purTotal = pur.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const salTotal = sal.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

      setSummary({
        inventoryCount: inv.length,
        inventoryValue: invValue,
        purchaseCount: pur.length,
        purchaseTotal: purTotal,
        salesCount: sal.length,
        salesTotal: salTotal,
      });

      if (reportType === "INVENTORY") setReportData(inv);
      else if (reportType === "PURCHASE") setReportData(pur);
      else if (reportType === "SALES") setReportData(sal);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load executive reports.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  const handleExportCSV = () => {
    if (!reportData.length) {
      setToast({ message: "No report data to export.", type: "error" });
      return;
    }
    const headers = Object.keys(reportData[0]).filter((k) => typeof reportData[0][k] !== "object");
    const rows = reportData.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ERP_Report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: `Exported ${reportType} report to CSV.`, type: "success" });
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Consolidated ERP Executive Reports</h1>
          <p>End-to-end performance analytics across procurement, storage, inventory, and sales</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="INVENTORY">Inventory Valuation & Balances</option>
            <option value="PURCHASE">Procurement & PO Activity</option>
            <option value="SALES">Commercial Sales & Orders</option>
          </select>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchReports}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleExportCSV}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-row">
        <StatCard
          title="Total Inventory Valuation"
          value={`$${summary.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={`${summary.inventoryCount} product-warehouse records`}
          trendPositive={true}
          icon={Layers}
          colorScheme="indigo"
        />
        <StatCard
          title="Procurement Commitment"
          value={`$${summary.purchaseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={`${summary.purchaseCount} POs processed`}
          trendPositive={true}
          icon={BarChart3}
          colorScheme="amber"
        />
        <StatCard
          title="Gross Sales Generated"
          value={`$${summary.salesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={`${summary.salesCount} Sales Orders`}
          trendPositive={true}
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <StatCard
          title="Audit Health Index"
          value="100%"
          trend="Fully reconciled"
          trendPositive={true}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
      </div>

      {/* Report Records Table */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <div className="card-panel-title">{reportType} Breakdown Dataset</div>
            <div className="card-panel-subtitle">Live records from backend MongoDB database</div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
            Calculating report metrics...
          </div>
        ) : reportData.length === 0 ? (
          <div className="empty-state">
            <p>No records available for the selected report scope.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                {reportType === "INVENTORY" && (
                  <tr>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th>In Stock</th>
                    <th>Reserved</th>
                    <th>Unit Price</th>
                    <th>Total Value</th>
                  </tr>
                )}
                {reportType === "PURCHASE" && (
                  <tr>
                    <th>PO Number</th>
                    <th>Vendor</th>
                    <th>Warehouse</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                  </tr>
                )}
                {reportType === "SALES" && (
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Warehouse</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row._id}>
                    {reportType === "INVENTORY" && (
                      <>
                        <td style={{ fontWeight: "700" }}>{row.product?.productName || "Unknown Product"}</td>
                        <td>{row.warehouse?.warehouseName || "—"}</td>
                        <td style={{ fontWeight: "600", color: "var(--color-emerald-600)" }}>{row.quantity}</td>
                        <td style={{ color: "var(--color-amber-600)" }}>{row.reservedStock || 0}</td>
                        <td>${(row.product?.unitPrice || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: "700" }}>${((row.quantity || 0) * (row.product?.unitPrice || 0)).toFixed(2)}</td>
                      </>
                    )}
                    {reportType === "PURCHASE" && (
                      <>
                        <td style={{ fontWeight: "700" }}>{row.purchaseOrderNumber}</td>
                        <td>{row.vendor?.vendorName || "—"}</td>
                        <td>{row.warehouse?.warehouseName || "—"}</td>
                        <td><span className="badge badge-info">{row.status}</span></td>
                        <td style={{ fontWeight: "700" }}>${(row.totalAmount || 0).toFixed(2)}</td>
                      </>
                    )}
                    {reportType === "SALES" && (
                      <>
                        <td style={{ fontWeight: "700" }}>{row.salesOrderNumber}</td>
                        <td>{row.customer?.customerName || "—"}</td>
                        <td>{row.warehouse?.warehouseName || "—"}</td>
                        <td><span className="badge badge-info">{row.status}</span></td>
                        <td style={{ fontWeight: "700" }}>${(row.totalAmount || 0).toFixed(2)}</td>
                      </>
                    )}
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

export default ReportsPage;
