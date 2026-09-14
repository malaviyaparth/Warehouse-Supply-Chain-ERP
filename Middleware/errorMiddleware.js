const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({
        success: false,
        message: "Validation failed",
        errors: Object.values(err.errors).map((e) => e.message),
      });
  }
  if (err.code === 11000) {
    return res
      .status(409)
      .json({
        success: false,
        message: "Duplicate value",
        fields: err.keyValue,
      });
  }
  if (err.name === "CastError")
    return res
      .status(400)
      .json({ success: false, message: `Invalid ${err.path}` });
  res
    .status(err.statusCode || 500)
    .json({ success: false, message: err.message || "Internal server error" });
};
module.exports = errorHandler;
