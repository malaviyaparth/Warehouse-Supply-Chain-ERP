import React, { useState, useEffect } from "react";
import { Download, DollarSign, TrendingUp, BarChart3, Users, RefreshCw } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const SalesReportsPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchSalesReports = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/reports/SALES");
      const list = res.data?.data || [];
      setSalesData(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load commercial sales analytics.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReports();
  }, []);

  const totalRevenue = salesData.reduce((acc, so) => acc + (so.totalAmount || 0), 0);
  const avgOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;
  const fulfilledOrders = salesData.filter((so) => ["SHIPPED", "DELIVERED"].includes(so.status));

  // Aggregate by customer
  const customerMap = {};
  salesData.forEach((so) => {
    const custName = so.customer?.customerName || so.customer?.name || "Unassigned Client";
    if (!customerMap[custName]) {
      customerMap[custName] = { client: custName, revenue: 0, orders: 0 };
    }
    customerMap[custName].revenue += so.totalAmount || 0;
    customerMap[custName].orders += 1;
  });

  const clientAccounts = Object.values(customerMap).map((c) => ({
    ...c,
    avgOrder: c.orders > 0 ? c.revenue / c.orders : 0,
    status: c.revenue > 50000 ? "TIER 1 KEY ACCOUNT" : "TIER 2 STANDARD",
  }));

  const handleExportCSV = () => {
    if (salesData.length === 0) {
      setToast({ type: "error", message: "No data available to export." });
      return;
    }
    const headers = "Order Number,Customer,Warehouse,Order Date,Total Amount,Status\n";
    const rows = salesData
      .map(
        (so) =>
          `"${so.salesOrderNumber || ""}","${so.customer?.customerName || ""}","${so.warehouse?.name || so.warehouse?.warehouseName || ""}","${so.orderDate || ""}","${so.totalAmount || 0}","${so.status || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sales-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: "success", message: "Sales report exported to CSV." });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Commercial Sales & Revenue Analytics</h1>
          <p>Key customer revenue metrics, order profitability, and sales pipeline fulfillment performance</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={fetchSalesReports} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button type="button" className="btn-primary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export Revenue Analytics</span>
          </button>
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          title="Total Contract Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          trend={`${salesData.length} total orders recorded`}
          trendPositive={true}
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Average Order Value"
          value={`$${Math.round(avgOrderValue).toLocaleString()}`}
          trend="Per commercial sales agreement"
          trendPositive={true}
          icon={TrendingUp}
          colorScheme="indigo"
        />
        <StatCard
          title="Fulfilled Pipeline"
          value={fulfilledOrders.length}
          trend={`${Math.round((fulfilledOrders.length / (salesData.length || 1)) * 100)}% fulfillment rate`}
          trendPositive={true}
          icon={BarChart3}
          colorScheme="emerald"
        />
      </div>

      <div className="card-panel">
        <div className="card-panel-title" style={{ marginBottom: "16px" }}>
          Key Commercial Account Performance Matrix
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--color-slate-500)" }}>
            Loading account metrics...
          </div>
        ) : clientAccounts.length === 0 ? (
          <div className="empty-state">
            <Users size={44} style={{ margin: "0 auto", opacity: 0.3 }} />
            <h3>No commercial account transactions</h3>
            <p>Generate sales orders with customers to see account performance metrics.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Enterprise Client Account</th>
                  <th>Cumulative Revenue</th>
                  <th>Order Frequency</th>
                  <th>Average Basket Value</th>
                  <th>Account Tier</th>
                </tr>
              </thead>
              <tbody>
                {clientAccounts.map((acc, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "700", color: "var(--color-slate-900)" }}>{acc.client}</td>
                    <td style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
                      ${acc.revenue.toLocaleString()}
                    </td>
                    <td>{acc.orders} Orders</td>
                    <td style={{ fontWeight: "600" }}>${Math.round(acc.avgOrder).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${acc.revenue > 50000 ? "badge-active" : "badge-info"}`}>
                        {acc.status}
                      </span>
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

export default SalesReportsPage;
