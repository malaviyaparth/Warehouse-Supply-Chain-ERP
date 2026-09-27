import React, { useState, useEffect } from "react";
import { MapPin, Truck, Clock, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const DeliveryTrackingPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/deliveries");
      const list = res.data?.data || [];
      const validList = Array.isArray(list) ? list : [];
      setDeliveries(validList);
      if (validList.length > 0 && !selectedId) {
        setSelectedId(validList[0]._id);
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load live delivery tracking data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const current = deliveries.find((d) => d._id === selectedId) || deliveries[0];

  const getProgress = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "25%";
      case "READY_FOR_DISPATCH":
        return "50%";
      case "IN_TRANSIT":
        return "75%";
      case "DELIVERED":
        return "100%";
      default:
        return "15%";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Live Logistics Fleet Tracking</h1>
          <p>Real-time consignment status, transit checkpoints, and recipient destination milestones</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={fetchDeliveries} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          {deliveries.length > 0 && (
            <select
              className="filter-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {deliveries.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.deliveryNumber || `DEL-${d._id.slice(-6)}`} - {d.customer?.customerName || "Consignee"}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-slate-500)" }}>
          Loading active delivery tracking telemetry...
        </div>
      ) : deliveries.length === 0 || !current ? (
        <div className="empty-state">
          <Truck size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <h3>No deliveries to track</h3>
          <p>Create and assign deliveries from sales orders to begin tracking transit milestones.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Telemetry Card */}
          <div className="card-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: "6px" }}>
                  <Truck size={13} />
                  <span>{current.deliveryNumber || `DEL-${current._id.slice(-6).toUpperCase()}`}</span>
                </span>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--color-slate-900)" }}>
                  {current.customer?.customerName || current.customer?.name || "Consignee Client"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--color-slate-400)", fontWeight: "700" }}>Status</div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--color-primary-700)" }}>{current.status}</div>
              </div>
            </div>

            <div style={{ margin: "20px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "600", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-slate-600)" }}>Transit Completion</span>
                <span style={{ color: "var(--color-primary-700)" }}>{getProgress(current.status)}</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--color-slate-200)", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    width: getProgress(current.status),
                    height: "100%",
                    background: "linear-gradient(90deg, var(--color-primary-600), var(--color-emerald-500))",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--color-slate-50)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--color-slate-400)", textTransform: "uppercase", fontWeight: "700" }}>Assigned Courier</div>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--color-slate-800)", marginTop: "2px" }}>
                  {current.assignedEmployee?.fullName || current.assignedEmployee?.name || "Operations Driver"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--color-slate-400)", textTransform: "uppercase", fontWeight: "700" }}>Origin Terminal</div>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--color-slate-800)", marginTop: "2px" }}>
                  {current.warehouse?.name || current.warehouse?.warehouseName || "Central Terminal"}
                </div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: "11px", color: "var(--color-slate-400)", textTransform: "uppercase", fontWeight: "700" }}>Destination Address</div>
                <div style={{ fontSize: "13px", color: "var(--color-slate-700)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={12} />
                  {current.deliveryAddress || current.customer?.address || "Client Receiving Bay"}
                </div>
              </div>
            </div>
          </div>

          {/* Checkpoints Card */}
          <div className="card-panel">
            <div className="card-panel-title" style={{ marginBottom: "16px" }}>
              Milestone Checkpoints & Audit Trail
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ color: "var(--color-emerald-600)", marginTop: "2px" }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>Waybill Assigned to Fleet</div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
                    {current.assignedAt ? new Date(current.assignedAt).toLocaleString() : "Initial dispatch schedule"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    color: ["READY_FOR_DISPATCH", "IN_TRANSIT", "DELIVERED"].includes(current.status)
                      ? "var(--color-emerald-600)"
                      : "var(--color-slate-300)",
                    marginTop: "2px",
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>Dispatched from Warehouse Facility</div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
                    {current.dispatchedAt ? new Date(current.dispatchedAt).toLocaleString() : "Awaiting dock gate exit"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    color: ["IN_TRANSIT", "DELIVERED"].includes(current.status)
                      ? "var(--color-emerald-600)"
                      : "var(--color-slate-300)",
                    marginTop: "2px",
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>En Route to Consignee Destination</div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
                    {current.status === "IN_TRANSIT"
                      ? "In active transit with delivery driver"
                      : current.status === "DELIVERED"
                      ? "Corridor completed"
                      : "Pending dispatch"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    color: current.status === "DELIVERED" ? "var(--color-emerald-600)" : "var(--color-slate-300)",
                    marginTop: "2px",
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "14px" }}>Final Dock Handover & Sign-Off</div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
                    {current.deliveredAt
                      ? new Date(current.deliveredAt).toLocaleString()
                      : "Pending client physical handover"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTrackingPage;
