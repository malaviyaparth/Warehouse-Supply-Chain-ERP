
// controllers/userController.js

const User = require("../models/User");

const getRoles = async (req, res) => {
    try {
        const users = await User.find();

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get users"
        });
    }
};

const getRolesById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get user"
        });
    }
};

const createRoles = async (req, res) => {
    try {
        const user = await User.create(req.body);

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create user"
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser
};