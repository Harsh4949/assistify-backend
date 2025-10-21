const mongoose = require('mongoose');

const DeviceHeartbeatSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    at: { type: Date, default: Date.now },
    metrics: {
      battery: { type: Number },
      networkType: { type: String },
      queueDepth: { type: Number }
    }
  }
);

DeviceHeartbeatSchema.index({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

module.exports = mongoose.model('DeviceHeartbeat', DeviceHeartbeatSchema);
