const Employee = require("../Models/Employee");
const Role = require("../Models/Role");
const {
  hashPassword,
  comparePassword,
  validatePasswordPolicy,
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} = require("../services/authService");
const { normalizeRole, ALLOWED_LOGIN_ROLES } = require("../Middleware/roleMiddleware");

// 1. Register Employee (Self-registration for Purchase Manager, Warehouse Manager, Sales Manager)
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, department, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Fields required: name, email, password, and role.",
      });
    }

    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const existing = await Employee.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    // Resolve Role: either by ObjectId or by roleName string
    let roleDoc;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(role).trim());
    if (isObjectId) {
      roleDoc = await Role.findById(role).populate("permissions");
    } else {
      const normalizedRoleName = normalizeRole(role);
      roleDoc = await Role.findOne({ roleName: normalizedRoleName, status: "ACTIVE" }).populate("permissions");
    }

    if (!roleDoc || roleDoc.status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Invalid or inactive role selected." });
    }

    // Explicit Rule: Super Admin cannot be registered via registration endpoint
    if (roleDoc.roleName === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super Admin cannot be registered. Super Admin has fixed credentials managed by the system administrator.",
      });
    }

    // Allowed self-registration roles
    const ALLOWED_REGISTER_ROLES = ["PURCHASE_MANAGER", "WAREHOUSE_MANAGER", "SALES_MANAGER"];
    if (!ALLOWED_REGISTER_ROLES.includes(roleDoc.roleName)) {
      return res.status(403).json({
        success: false,
        message: `Self-registration is only permitted for: ${ALLOWED_REGISTER_ROLES.join(", ")}.`,
      });
    }

    // Auto-derive department if not supplied
    let dept = department;
    if (!dept) {
      if (roleDoc.roleName === "PURCHASE_MANAGER") dept = "PURCHASE";
      else if (roleDoc.roleName === "WAREHOUSE_MANAGER") dept = "WAREHOUSE";
      else if (roleDoc.roleName === "SALES_MANAGER") dept = "SALES";
      else dept = "ADMIN";
    }

    const employee = await Employee.create({
      name,
      email: email.toLowerCase(),
      password: await hashPassword(password),
      phone: phone || "",
      department: dept,
      role: roleDoc._id,
      status: "ACTIVE",
    });

    res.status(201).json({
      success: true,
      message: `${roleDoc.roleName.replace(/_/g, " ")} registered successfully. You can now log in with your credentials.`,
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        role: roleDoc.roleName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate({ path: "role", populate: { path: "permissions" } });

    if (!employee || !(await comparePassword(password, employee.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (employee.status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "Account is inactive or suspended." });
    }

    const role = employee.role;
    if (!role || role.status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "Employee role is invalid or inactive." });
    }

    const normalizedRole = normalizeRole(role.roleName);
    if (!ALLOWED_LOGIN_ROLES.includes(normalizedRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only SUPER_ADMIN, PURCHASE_MANAGER, WAREHOUSE_MANAGER, and SALES_MANAGER roles are authorized to log in.",
      });
    }

    const permissions = role.permissions ? role.permissions.map((p) => p.permissionName) : [];

    const rolePayload = {
      _id: role._id,
      roleName: normalizedRole,
    };

    const accessToken = generateAccessToken(employee, rolePayload, permissions);
    const refreshToken = await generateRefreshToken(employee._id, req.ip);

    // Update last login
    employee.lastLogin = new Date();
    await employee.save({ validateBeforeSave: false });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        role: normalizedRole,
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Refresh Access Token
const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required." });
    }

    const { employeeId, newRefreshToken } = await rotateRefreshToken(refreshToken, req.ip);
    const employee = await Employee.findById(employeeId).populate({
      path: "role",
      populate: { path: "permissions" },
    });

    if (!employee || employee.status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "Employee is not active." });
    }

    const role = employee.role;
    const normalizedRole = normalizeRole(role?.roleName);
    if (!ALLOWED_LOGIN_ROLES.includes(normalizedRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only SUPER_ADMIN, PURCHASE_MANAGER, WAREHOUSE_MANAGER, and SALES_MANAGER roles are authorized to access the system.",
      });
    }

    const permissions = role.permissions ? role.permissions.map((p) => p.permissionName) : [];
    const rolePayload = {
      _id: role._id,
      roleName: normalizedRole,
    };
    const newAccessToken = generateAccessToken(employee, rolePayload, permissions);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message || "Invalid refresh token." });
  }
};

// 4. Logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
};

// 5. Get Current User Profile (/me)
const me = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.user.id)
      .populate({ path: "role", populate: { path: "permissions" } })
      .select("-password");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    const normalizedRole = normalizeRole(employee.role?.roleName);
    res.json({
      success: true,
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        role: normalizedRole,
        permissions: employee.role?.permissions?.map((p) => p.permissionName) || [],
        lastLogin: employee.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 6. Forgot Password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Corporate email is required." });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() });
    let devResetToken = null;

    if (employee && employee.status === "ACTIVE") {
      const crypto = require("crypto");
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      employee.passwordResetToken = hashedToken;
      employee.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      await employee.save({ validateBeforeSave: false });

      // In development mode, provide token for easy testing
      if (process.env.NODE_ENV !== "production") {
        devResetToken = rawToken;
      }
    }

    // Always respond with identical message to prevent user enumeration
    res.json({
      success: true,
      message: "If an active account exists for this email, password recovery instructions have been dispatched.",
      ...(devResetToken ? { devResetToken } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// 7. Reset Password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    const passwordCheck = validatePasswordPolicy(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const crypto = require("crypto");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const employee = await Employee.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired.",
      });
    }

    employee.password = await hashPassword(newPassword);
    employee.passwordResetToken = undefined;
    employee.passwordResetExpires = undefined;
    await employee.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "Password has been successfully updated. You may now log in.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshTokenHandler,
  logout,
  me,
  forgotPassword,
  resetPassword,
};

