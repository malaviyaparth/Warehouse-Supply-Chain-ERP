const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
    {
        roleName: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Role", roleSchema);