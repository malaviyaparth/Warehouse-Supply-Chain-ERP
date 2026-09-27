import React, { useState, useEffect } from "react";
import { Sliders, Save, RefreshCw } from "lucide-react";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const SystemConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState({
    defaultReorderThreshold: 15,
    lowStockAlertEnabled: true,
    defaultTaxRate: 8.5,
    invoicePrefix: "INV-",
    poPrefix: "PO-",
    soPrefix: "SO-",
    notificationEmail: "alerts@inventorypro.com",
    enableEmailAlerts: false,
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/settings/config");
      if (res.data?.data) {
        setConfig((prev) => ({
          ...prev,
          ...res.data.data,
        }));
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load system configuration.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put("/api/settings/config", {
        ...config,
        defaultReorderThreshold: Number(config.defaultReorderThreshold),
        defaultTaxRate: Number(config.defaultTaxRate),
      });
      setToast({ message: "System configuration updated successfully.", type: "success" });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to deploy configuration.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header-row">
        <div className="page-header-title">
          <h1>System Configuration & Business Parameters</h1>
          <p>Inventory reorder thresholds, automated alerts, and operational document numbering</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchConfig}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="submit"
            form="sys-config-form"
            className="btn-primary"
            disabled={submitting}
          >
            <Save size={16} />
            <span>{submitting ? "Deploying..." : "Deploy Config"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading business parameters...
        </div>
      ) : (
        <form id="sys-config-form" onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Inventory & Reorder Controls */}
            <div className="card-panel">
              <div className="card-panel-title" style={{ marginBottom: "18px" }}>
                Inventory & Reorder Rules
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Default Safety Stock Threshold (Units)</label>
                  <input
                    type="number"
                    min="0"
                    name="defaultReorderThreshold"
                    value={config.defaultReorderThreshold}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Default Sales Tax (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="defaultTaxRate"
                    value={config.defaultTaxRate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="lowStockAlertEnabled"
                    checked={config.lowStockAlertEnabled}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--color-slate-800)" }}>
                      Automated Low-Stock Scanning
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
                      Periodically evaluate per-warehouse ROP and generate replenishment requests
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Document Numbering & Notifications */}
            <div className="card-panel">
              <div className="card-panel-title" style={{ marginBottom: "18px" }}>
                Document Prefixes & Alerts
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div className="form-field">
                  <label>Invoice Prefix</label>
                  <input
                    type="text"
                    name="invoicePrefix"
                    value={config.invoicePrefix}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
                  <label>Purchase Order Prefix</label>
                  <input
                    type="text"
                    name="poPrefix"
                    value={config.poPrefix}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
                  <label>Sales Order Prefix</label>
                  <input
                    type="text"
                    name="soPrefix"
                    value={config.soPrefix}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>System Dispatch Alert Email</label>
                <input
                  type="email"
                  name="notificationEmail"
                  value={config.notificationEmail}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="enableEmailAlerts"
                    checked={config.enableEmailAlerts}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--color-slate-800)" }}>
                      Transmit Email Digest to Dispatch Desk
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-slate-500)" }}>
                      Relay critical purchase request triggers to central operations
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SystemConfigPage;
