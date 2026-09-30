import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowLeft, MailCheck, KeyRound, CheckCircle } from "lucide-react";
import Toast from "../../components/common/Toast";
import axiosInstance from "../../utils/axiosConfig";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Reset Token & New Password Form
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axiosInstance.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to process recovery request.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setToast({ type: "error", message: "Reset token and new password are required." });
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post("/api/auth/reset-password", {
        token: resetToken,
        newPassword,
      });
      setResetComplete(true);
      setToast({ type: "success", message: "Password reset successful! You may now sign in." });
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Invalid or expired reset token.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Package size={26} />
          </div>
          <div>
            <h1>InventoryPro ERP</h1>
            <p>Password Recovery</p>
          </div>
        </div>

        <div className="login-heading">
          <h2>Reset Password</h2>
          <p>
            {resetComplete
              ? "Password updated successfully"
              : submitted
              ? "Enter your new password below"
              : "Enter your corporate email to receive instructions"}
          </p>
        </div>

        {resetComplete ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--color-emerald-50)",
                color: "var(--color-emerald-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle size={28} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-slate-900)", marginBottom: "6px" }}>
              Credentials Updated
            </h3>
            <p style={{ fontSize: "13.5px", color: "var(--color-slate-500)", marginBottom: "24px" }}>
              Your account password has been updated. Please sign in with your new password.
            </p>
            <Link to="/login" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              <ArrowLeft size={16} />
              <span>Return to Sign In</span>
            </Link>
          </div>
        ) : submitted ? (
          <form onSubmit={handleResetPassword}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "var(--color-slate-600)" }}>
                Recovery instructions initiated for <strong>{email}</strong>.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="reset-token">Reset Authorization Token</label>
              <input
                id="reset-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter reset token"
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Secure Password</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Updating..." : "Save New Password"}
            </button>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Link
                to="/login"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--color-primary-600)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reset-email">Corporate Email Address</label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Processing..." : "Dispatch Recovery Link"}
            </button>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Link
                to="/login"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--color-primary-600)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
