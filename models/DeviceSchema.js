const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema(
  {
    fcmToken: { type: String, required: true, unique: true },
    platform: { type: String },
    appVersion: { type: String },
    model: { type: String },
    simSlots: { type: Number },
    phoneNumberHash: { type: String },
    capabilities: {
      smsSend: { type: Boolean }
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'busy'],
      default: 'offline'
    },
    lastHeartbeatAt: { type: Date },
    battery: { type: Number },
    network: { type: String },
    locationApprox: { type: String },
    assignedSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null
    },
    secrets: {
      deviceKeyHash: { type: String }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', DeviceSchema);
