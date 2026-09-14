const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    if (roles.length && !roles.includes(req.user.roleName))
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    next();
  };
module.exports = authorize;
