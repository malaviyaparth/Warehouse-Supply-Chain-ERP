const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const RefreshToken = require("../Models/RefreshToken");

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "erp_jwt_super_secret_access_key_2026";
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Bcrypt password helpers
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

// Password policy validator: min 6 chars (can be relaxed or strong)
const validatePasswordPolicy = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long.",
    };
  }
  return { isValid: true };
};

// Generate short-lived Access Token
const generateAccessToken = (employee, role, permissions = []) => {
  const payload = {
    id: employee._id,
    email: employee.email,
    name: employee.name,
    department: employee.department,
    roleId: role ? role._id : undefined,
    roleName: role ? role.roleName : "EMPLOYEE",
    permissions: permissions.map((p) => (typeof p === "string" ? p : p.permissionName)),
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// Generate and persist Refresh Token (with rotation)
const generateRefreshToken = async (employeeId, ipAddress = "") => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await RefreshToken.create({
    token,
    employee: employeeId,
    expiresAt,
    createdByIp: ipAddress,
  });

  return token;
};

// Verify Access Token
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

// Revoke a Refresh Token
const revokeRefreshToken = async (token) => {
  return await RefreshToken.findOneAndUpdate({ token }, { revoked: true });
};

// Validate and rotate Refresh Token
const rotateRefreshToken = async (oldToken, ipAddress = "") => {
  const tokenDoc = await RefreshToken.findOne({ token: oldToken });

  if (!tokenDoc || tokenDoc.revoked || tokenDoc.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh token");
  }

  // Revoke the old token
  tokenDoc.revoked = true;
  await tokenDoc.save();

  // Issue a new token
  const newRefreshToken = await generateRefreshToken(tokenDoc.employee, ipAddress);
  return { employeeId: tokenDoc.employee, newRefreshToken };
};

// Backwards compatibility helpers
const setUser = (payload) =>
  jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
const getUser = (token) => jwt.verify(token, ACCESS_TOKEN_SECRET);

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordPolicy,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  revokeRefreshToken,
  rotateRefreshToken,
  setUser,
  getUser,
};
