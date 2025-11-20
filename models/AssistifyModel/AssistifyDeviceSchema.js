const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssistifyDeviceSchema = new Schema({
  deviceId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // firebase uid
  keyId: { type: String, required: true },
  deviceKeyHash: { type: String, required: true },
  wrappedKey: { type: String, default: null }, // optional: encrypted key if you need server-side decrypt
  fcmToken: { type: String },
  model: { type: String },
  capabilities: { type: String },
  status: { type: String, enum: ['pending','paired','active','disabled'], default: 'pending' },
  pairedAt: { type: Date },
  lastSeenAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('AssistifyDevice', AssistifyDeviceSchema);
