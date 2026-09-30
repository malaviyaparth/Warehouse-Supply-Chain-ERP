import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, Package, Loader2, UserCheck, Shield, CheckCircle2 } from "lucide-react";
import { registerUser } from "../../api/authApi";
import { loginUser } from "../../store/authSlice";
import { getDashboardRoute } from "../../utils/roles";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "PURCHASE_MANAGER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all required fields (Name, Email, Password, and Role).");
      return;
    }

    if (!formData.role) {
      setError("Please select a system user role.");
      return;
    }

    try {
      setLoading(true);
      let dept = "ADMIN";
      if (formData.role === "PURCHASE_MANAGER") dept = "PURCHASE";
      else if (formData.role === "WAREHOUSE_MANAGER") dept = "WAREHOUSE";
      else if (formData.role === "SALES_MANAGER") dept = "SALES";

      const res = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        department: dept,
      });

      if (res.success) {
        setSuccess("Account registered successfully! Signing into authorized workspace...");

        // Auto-authenticate immediately to seamlessly direct to their role dashboard
        try {
          const actionResult = await dispatch(
            loginUser({
              email: formData.email.trim().toLowerCase(),
              password: formData.password,
            })
          );

          if (loginUser.fulfilled.match(actionResult)) {
            const loggedUser = actionResult.payload.user;
            const targetDashboard = getDashboardRoute(loggedUser?.role);
            setTimeout(() => {
              navigate(targetDashboard, { replace: true });
            }, 600);
            return;
          }
        } catch (loginErr) {
          console.warn("Auto-login error after registration:", loginErr);
        }

        // Graceful fallback to login page
        setTimeout(() => {
          navigate("/login", {
            state: {
              email: formData.email.trim().toLowerCase(),
              message: "Account created successfully! Please sign in with your credentials.",
            },
            replace: true,
          });
        }, 1200);
      } else {
        setError(res.message || "Failed to register account.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred during registration.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: "480px" }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Package size={26} />
          </div>
          <div>
            <h1>InventoryPro ERP</h1>
            <p>Warehouse & Supply Chain</p>
          </div>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h2>Create System Account</h2>
          <p>Register as a specialized operational manager</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid #10b981",
              color: "#10b981",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="login-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. manager@erp.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          {/* Role Dropdown */}
          <div className="form-group">
            <label htmlFor="role" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <UserCheck size={16} />
              <span>Select System Role *</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #334155)",
                backgroundColor: "var(--input-bg, #0f172a)",
                color: "var(--text-primary, #f8fafc)",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="PURCHASE_MANAGER">
                Purchase Manager (Purchasing, POs, Vendors, Goods Receipt)
              </option>
              <option value="WAREHOUSE_MANAGER">
                Warehouse Manager (Warehouses, Inventory, Transfers, Stock In/Out)
              </option>
              <option value="SALES_MANAGER">
                Sales Manager (Sales Orders, Reservations, Invoices, Deliveries, Returns)
              </option>
            </select>
          </div>

          {/* Super Admin Notice */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "6px",
              backgroundColor: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              color: "#93c5fd",
              fontSize: "12px",
              lineHeight: "1.4",
              marginBottom: "16px",
            }}
          >
            <Shield size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
            <span>
              <strong>Note:</strong> Super Admin is a system-fixed role and cannot be self-registered. It is accessible only via dedicated administrative credentials.
            </span>
          </div>

          {/* Phone (Optional) */}
          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="e.g. +1 555 123 4567"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 chars, 1 upper, 1 lower, 1 number, 1 special"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
            style={{ marginTop: "8px" }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="loading-icon" />
                <span>Registering Account...</span>
              </>
            ) : (
              "Register System Account"
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "14px", color: "var(--text-secondary, #94a3b8)" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "#3b82f6", fontWeight: "600", textDecoration: "none" }}
          >
            Sign In here
          </Link>
        </div>

        {/* Footer */}
        <div className="login-footer">
          Warehouse & Supply Chain Management System &copy; 2026
        </div>
      </div>
    </div>
  );
};

export default Register;
