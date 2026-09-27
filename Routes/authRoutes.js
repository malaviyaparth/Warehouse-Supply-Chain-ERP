const router = require("express").Router();
const authController = require("../Controllers/authController");
const authenticate = require("../Middleware/authMiddleware");

// Public routes
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshTokenHandler);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Protected registration and session check
router.post("/register", authController.register);
router.get("/me", authenticate, authController.me);

module.exports = router;
