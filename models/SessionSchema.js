const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    assignedDeviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    state: {
      type: String,
      enum: ['requested', 'active', 'stopping', 'ended', 'expired'],
      default: 'requested'
    },
    expiresAt: { type: Date, required: true },
    startedAt: { type: Date },
    stoppedAt: { type: Date },
    rateLimitPerMin: { type: Number, default: 30 }
  },
  { timestamps: true }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', SessionSchema);
