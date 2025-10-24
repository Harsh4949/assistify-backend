const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const MessageSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
  to: { type: String, required: true },
  body: { type: String, required: true },
  status: {
    type: String,
    enum: ['queued', 'dispatched', 'sent', 'failed', 'delivered'],
    default: 'queued'
  },
  sentAt: { type: Date },       // time message was sent
  deliveredAt: { type: Date },  // time delivery was confirmed
  error: { type: String }
}, { timestamps: true });

// Optional: index for efficient session-based queries
MessageSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = model('Message', MessageSchema);
