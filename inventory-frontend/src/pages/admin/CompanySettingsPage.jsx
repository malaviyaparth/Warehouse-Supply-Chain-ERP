import React, { useState, useEffect } from "react";
import { Building, Save, Check, RefreshCw } from "lucide-react";
import Toast from "../../components/common/Toast";
import api from "../../api/axios";

export const CompanySettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    taxNumber: "",
    currency: "USD",
    timezone: "UTC",
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/settings");
      if (res.data?.data) {
        setSettings({
          companyName: res.data.data.companyName || "",
          companyEmail: res.data.data.companyEmail || "",
          companyPhone: res.data.data.companyPhone || "",
          companyAddress: res.data.data.companyAddress || "",
          taxNumber: res.data.data.taxNumber || "",
          currency: res.data.data.currency || "USD",
          timezone: res.data.data.timezone || "UTC",
        });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to load company profile.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put("/api/settings", settings);
      setToast({ message: "Company profile updated successfully.", type: "success" });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to update company profile.",
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
          <h1>Company Profile & ERP Settings</h1>
          <p>Organizational metadata, currency standards, and fiscal policies</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="submit"
            form="company-settings-form"
            className="btn-primary"
            disabled={submitting}
          >
            <Save size={16} />
            <span>{submitting ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-slate-500)" }}>
          Loading company profile configuration...
        </div>
      ) : (
        <form id="company-settings-form" onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Organization Details */}
            <div className="card-panel">
              <div className="card-panel-title" style={{ marginBottom: "18px" }}>
                Corporate Entity
              </div>

              <div className="form-field">
                <label>Legal Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={settings.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Tax Identification / EIN</label>
                  <input
                    type="text"
                    name="taxNumber"
                    value={settings.taxNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-field">
                  <label>Operational Currency</label>
                  <select
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Primary Office Address</label>
                <textarea
                  name="companyAddress"
                  value={settings.companyAddress}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            {/* Communications & Timezone */}
            <div className="card-panel">
              <div className="card-panel-title" style={{ marginBottom: "18px" }}>
                Contact & Regional Parameters
              </div>

              <div className="form-field">
                <label>Corporate Support Email</label>
                <input
                  type="email"
                  name="companyEmail"
                  value={settings.companyEmail}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>Contact Phone</label>
                <input
                  type="text"
                  name="companyPhone"
                  value={settings.companyPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label>System Timezone</label>
                <select
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleChange}
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CompanySettingsPage;
