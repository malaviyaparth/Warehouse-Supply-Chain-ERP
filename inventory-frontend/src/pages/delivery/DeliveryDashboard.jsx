import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Truck, MapPin, CheckCircle2, AlertCircle, RefreshCw, Plus } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const DeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/deliveries");
      const list = res.data?.data || [];
      setDeliveries(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load logistics fleet metrics.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const activeDispatches = deliveries.filter((d) =>
    ["ASSIGNED", "READY_FOR_DISPATCH", "IN_TRANSIT"].includes(d.status)
  );
  const deliveredCount = deliveries.filter((d) => d.status === "DELIVERED").length;
  const failedCount = deliveries.filter((d) => d.status === "FAILED").length;
  const recentRuns = deliveries.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Logistics Fleet & Delivery Operations</h1>
          <p>Fleet routing, live transit checkpoints, electronic proofs of delivery, and driver assignment</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={fetchDeliveries} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <Link to="/delivery/assigned" className="btn-secondary">
            <Truck size={15} />
            <span>Assigned Dispatches</span>
          </Link>
          <Link to="/delivery/tracking" className="btn-primary">
            <MapPin size={15} />
            <span>Live Route Tracking</span>
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          title="Active Route Dispatches"
          value={activeDispatches.length}
          trend={`${deliveries.filter((d) => d.status === "IN_TRANSIT").length} currently in transit`}
          trendPositive={true}
          icon={Truck}
          colorScheme="indigo"
        />
        <StatCard
          title="Successfully Delivered"
          value={deliveredCount}
          trend="Completed client handovers"
          trendPositive={true}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatCard
          title="Completion SLA"
          value={deliveries.length > 0 ? `${Math.round((deliveredCount / deliveries.length) * 100)}%` : "0%"}
          trend="Delivered vs total manifest"
          trendPositive={true}
          icon={MapPin}
          colorScheme="emerald"
        />
        <StatCard
          title="Delivery Exceptions"
          value={failedCount}
          trend={failedCount > 0 ? "Requires rerouting or rescheduling" : "Clean dispatch record"}
          trendPositive={failedCount === 0}
          icon={AlertCircle}
          colorScheme="rose"
        />
      </div>

      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <div className="card-panel-title">Active Logistics Fleet Manifests</div>
            <div className="card-panel-subtitle">Current consignments in transit across regional distribution corridors</div>
          </div>
          <Link to="/delivery/assigned" style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--color-primary-600)" }}>
            Fleet Manifest &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--color-slate-500)" }}>
            Loading fleet manifests...
          </div>
        ) : recentRuns.length === 0 ? (
          <div className="empty-state">
            <Truck size={44} style={{ margin: "0 auto", opacity: 0.3 }} />
            <h3>No delivery dispatches active</h3>
            <p>Assign fulfilled sales orders to delivery personnel to track transit runs.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Delivery Waybill</th>
                  <th>Assigned Courier / Driver</th>
                  <th>Destination Address</th>
                  <th>Origin Warehouse</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr key={run._id}>
                    <td style={{ fontWeight: "700", color: "var(--color-primary-700)" }}>
                      {run.deliveryNumber || `DEL-${run._id.slice(-6).toUpperCase()}`}
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
                      {run.assignedEmployee?.fullName || run.assignedEmployee?.name || "Assigned Driver"}
                    </td>
                    <td>{run.deliveryAddress || run.customer?.address || "Client Destination"}</td>
                    <td>{run.warehouse?.name || run.warehouse?.warehouseName || "Central Terminal"}</td>
                    <td>
                      <span
                        className={`badge ${
                          run.status === "DELIVERED"
                            ? "badge-active"
                            : run.status === "IN_TRANSIT"
                            ? "badge-warning"
                            : run.status === "FAILED"
                            ? "badge-inactive"
                            : "badge-info"
                        }`}
                      >
                        {run.status}
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

export default DeliveryDashboard;
