import { useState, useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Package, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../store/authSlice";
import { getDashboardRoute, isPathAuthorizedForRole } from "../../utils/roles";

const Login = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }));
    }
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
    }
  }, [location.state]);

  // If already logged in, redirect to their role-appropriate dashboard
  if (isAuthenticated && user) {
    const target = getDashboardRoute(user.role);
    if (target && target !== "/login") {
      return <Navigate to={target} replace />;
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const fillCredentials = (email, password) => {
    setFormData({ email, password });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const actionResult = await dispatch(
        loginUser({
          email: formData.email.trim(),
          password: formData.password,
        })
      );

      if (loginUser.fulfilled.match(actionResult)) {
        const loggedUser = actionResult.payload.user;
        const targetDashboard = getDashboardRoute(loggedUser?.role);

        const fromPath =
          location.state?.from?.pathname ||
          (typeof location.state?.from === "string" ? location.state.from : null);

        let redirectPath = targetDashboard;
        // Only redirect to 'from' path if the user's role is strictly authorized to view it
        if (fromPath && isPathAuthorizedForRole(fromPath, loggedUser?.role)) {
          redirectPath = fromPath;
        }

        navigate(redirectPath, { replace: true });
      } else {
        setError(actionResult.payload || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

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
          <h2>Sign in to Account</h2>
          <p>Enterprise Resource Planning workspace</p>
        </div>

        {/* Success / Status Message */}
        {successMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid #10b981",
              color: "#10b981",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="login-error">
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. purchase@erp.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="loading-icon" />
                <span>Authenticating...</span>
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>

        {/* Register Account Link */}
        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "var(--text-secondary, #94a3b8)" }}>
          Need a system manager account?{" "}
          <Link
            to="/register"
            style={{ color: "#3b82f6", fontWeight: "600", textDecoration: "none" }}
          >
            Register here
          </Link>
        </div>

        {/* Quick Demo Helper for all 4 roles */}
        <div className="demo-accounts-box" style={{ marginTop: "20px" }}>
          <div className="demo-accounts-title">
            <span>System User Accounts</span>
            <KeyRound size={14} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => fillCredentials("admin@erp.com", "Admin@ERP2026!")}
              title="Super Admin - Fixed system credentials"
            >
              <span style={{ fontSize: "12px" }}>admin@erp.com</span>
              <span className="demo-chip-role">Super Admin</span>
            </button>
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => fillCredentials("purchase@erp.com", "Purchase@ERP2026!")}
              title="Purchase Manager"
            >
              <span style={{ fontSize: "12px" }}>purchase@erp.com</span>
              <span className="demo-chip-role">Purchase Mgr</span>
            </button>
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => fillCredentials("warehouse@erp.com", "Warehouse@ERP2026!")}
              title="Warehouse Manager"
            >
              <span style={{ fontSize: "12px" }}>warehouse@erp.com</span>
              <span className="demo-chip-role">Warehouse Mgr</span>
            </button>
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => fillCredentials("sales@erp.com", "Sales@ERP2026!")}
              title="Sales Manager"
            >
              <span style={{ fontSize: "12px" }}>sales@erp.com</span>
              <span className="demo-chip-role">Sales Mgr</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          Warehouse & Supply Chain Management System &copy; 2026
        </div>
      </div>
    </div>
  );
};

export default Login;