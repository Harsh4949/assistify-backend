const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionSchema = new Schema({
  userId: { type: String, required: true },
  assignedDeviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
  state: {
    type: String,
    enum: ['active', 'ended', 'stopped', 'expired'],
    default: 'active'
  },
  startedAt: { type: Date, default: Date.now },
  stoppedAt: { type: Date },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', SessionSchema);
