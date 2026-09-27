const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    entityType: {
      type: String,
      required: true,
      trim: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    description: {
      type: String,
      trim: true,
    },

    oldData: {
      type: mongoose.Schema.Types.Mixed,
    },

    newData: {
      type: mongoose.Schema.Types.Mixed,
    },

    ipAddress: {
      type: String,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

auditLogSchema.virtual("userId").get(function () {
  return this.employee;
}).set(function (val) {
  this.employee = val;
});

auditLogSchema.virtual("module").get(function () {
  return this.entityType;
}).set(function (val) {
  this.entityType = val;
});

auditLogSchema.virtual("oldValue").get(function () {
  return this.oldData;
}).set(function (val) {
  this.oldData = val;
});

auditLogSchema.virtual("newValue").get(function () {
  return this.newData;
}).set(function (val) {
  this.newData = val;
});

auditLogSchema.index({ employee: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);

