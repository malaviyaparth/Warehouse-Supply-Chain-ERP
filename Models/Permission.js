const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
    {
        permissionName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Permission", permissionSchema);