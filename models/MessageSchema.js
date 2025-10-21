const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    to: { type: String },
    body: { type: String },
    status: {
      type: String,
      enum: ['queued', 'dispatched', 'sent', 'delivered', 'failed', 'expired']
    },
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    providerMessageId: { type: String },
    deliveredAt: { type: Date },
    failedAt: { type: Date }
  },
  { timestamps: true }
);

MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('Message', MessageSchema);
