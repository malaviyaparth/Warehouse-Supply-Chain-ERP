// routes/userRoutes.js

const express = require("express");
const router = express.Router();

const {
    getRoles,
    getRolesById,
    createRoles
} = require("../controllers/userController");

router.get("/", getRoles);
router.get("/:id", getRolesById);
router.post("/", createRoles);

module.exports = router;