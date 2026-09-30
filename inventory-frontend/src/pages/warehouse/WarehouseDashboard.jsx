import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Warehouse, Boxes, ArrowLeftRight, ClipboardCheck, AlertTriangle, RefreshCw } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const WarehouseDashboard = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whRes, trfRes, invRes] = await Promise.all([
        axiosInstance.get("/api/warehouses"),
        axiosInstance.get("/api/stock-transfers"),
        axiosInstance.get("/api/inventory"),
      ]);

      const whList = whRes.data?.data || whRes.data || [];
      const trfList = trfRes.data?.data || trfRes.data || [];
      const invList = invRes.data?.data || invRes.data || [];

      setWarehouses(Array.isArray(whList) ? whList : []);
      setTransfers(Array.isArray(trfList) ? trfList : []);
      setInventory(Array.isArray(invList) ? invList : []);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load warehouse metrics.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalStockUnits = inventory.reduce((acc, i) => acc + (i.quantity || 0), 0);
  const pendingTransfers = transfers.filter((t) => ["REQUESTED", "APPROVED", "IN_TRANSIT"].includes(t.status)).length;
  const totalDamagedUnits = inventory.reduce((acc, i) => acc + (i.damagedStock || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>Warehouse Management Hub</h1>
          <p>Multi-facility operations, bay allocations, inter-warehouse movements, and physical audits</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <Link to="/warehouse/transfers" className="btn-secondary">
            <ArrowLeftRight size={15} />
            <span>Transfer Manifests</span>
          </Link>
          <Link to="/warehouse/audit" className="btn-primary">
            <ClipboardCheck size={15} />
            <span>Cycle Count Audit</span>
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          title="Active Facilities"
          value={warehouses.length}
          trend={`${warehouses.filter((w) => w.isActive !== false).length} operational`}
          trendPositive={true}
          icon={Warehouse}
          colorScheme="indigo"
        />
        <StatCard
          title="Total Units in Storage"
          value={totalStockUnits.toLocaleString()}
          trend="Across all warehouse slots"
          trendPositive={true}
          icon={Boxes}
          colorScheme="emerald"
        />
        <StatCard
          title="Transfers In Flight"
          value={pendingTransfers}
          trend={`${transfers.filter((t) => t.status === "COMPLETED").length} fulfilled to date`}
          trendPositive={true}
          icon={ArrowLeftRight}
          colorScheme="amber"
        />
        <StatCard
          title="Quarantined Damaged"
          value={totalDamagedUnits}
          trend={totalDamagedUnits > 0 ? "Requires scrap sign-off" : "Clean inventory status"}
          trendPositive={totalDamagedUnits === 0}
          icon={AlertTriangle}
          colorScheme="rose"
        />
      </div>

      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <div className="card-panel-title">Facility Storage & Space Utilization</div>
            <div className="card-panel-subtitle">Live status metrics across regional warehouse network</div>
          </div>
          <Link to="/warehouse/list" style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--color-primary-600)" }}>
            Facility Directory &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--color-slate-500)" }}>
            Loading regional facilities...
          </div>
        ) : warehouses.length === 0 ? (
          <div className="empty-state">
            <Warehouse size={44} style={{ margin: "0 auto", opacity: 0.3 }} />
            <h3>No warehouse facilities configured</h3>
            <p>Add your first facility in the Warehouses directory.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Facility Name</th>
                  <th>Location</th>
                  <th>Contact Person</th>
                  <th>Phone / Email</th>
                  <th>Stock Items Stored</th>
                  <th>Operational Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh) => {
                  const facilityItems = inventory.filter(
                    (i) => (i.warehouse?._id || i.warehouse) === wh._id
                  );
                  const facilityUnits = facilityItems.reduce((acc, i) => acc + (i.quantity || 0), 0);

                  return (
                    <tr key={wh._id}>
                      <td style={{ fontWeight: "600", color: "var(--color-slate-900)" }}>
                        {wh.name || wh.warehouseName}
                      </td>
                      <td>{wh.location || wh.address || "Main Terminal"}</td>
                      <td>{wh.contactPerson || "Operations Lead"}</td>
                      <td>{wh.phone || wh.email || "—"}</td>
                      <td>
                        <strong>{facilityUnits.toLocaleString()}</strong> units ({facilityItems.length} SKUs)
                      </td>
                      <td>
                        <span className={`badge ${wh.isActive !== false ? "badge-active" : "badge-inactive"}`}>
                          {wh.isActive !== false ? "OPERATIONAL" : "INACTIVE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseDashboard;
