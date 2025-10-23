const mongoose = require('mongoose');

const IncomingSmsSchema = new mongoose.Schema({

  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },

  from: { type: String, required: true },

  body: { type: String, required: true },

  receivedAt: { type: Date, default: Date.now }
  
}, { timestamps: true });

module.exports = mongoose.model('IncomingSms', IncomingSmsSchema);
