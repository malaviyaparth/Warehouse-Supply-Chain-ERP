const router = require("express").Router();
const c = require("../Controllers/authController");
const auth = require("../Middleware/authMiddleware");
router.post("/register", c.register);
router.post("/login", c.login);
router.get("/me", auth, c.me);
module.exports = router;
