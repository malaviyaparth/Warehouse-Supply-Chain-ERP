const { verifyAccessToken } = require("../services/authService");
const Employee = require("../Models/Employee");
const { normalizeRole } = require("./roleMiddleware");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Bearer token missing.",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Access token is invalid or expired.",
        code: "TOKEN_EXPIRED",
      });
    }

    // Verify employee exists and is active
    const employee = await Employee.findById(decoded.id).select("status");
    if (!employee || employee.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User account is suspended, inactive, or no longer exists.",
      });
    }

    req.user = {
      ...decoded,
      roleName: normalizeRole(decoded.roleName),
      originalRoleName: decoded.roleName,
    };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
