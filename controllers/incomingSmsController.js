const mongoose = require('mongoose');
const IncomingSms = require('../models/IncomingSmsSchema');
const Session = require('../models/SessionSchema');


exports.receiveSms = async (req, res) => {
  try {
    const { sessionId, from, body, receivedAt } = req.body;

    if (!sessionId || !from || !body) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, from, body.' });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId format.' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.state !== 'active') {
      return res.status(400).json({ error: 'Session is not active.' });
    }

    // Parse receivedAt safely
    let parsedDate = new Date();
    if (receivedAt) {
      const ts = Number(receivedAt);
      const tempDate = Number.isFinite(ts) ? new Date(ts) : new Date(receivedAt);
      if (!isNaN(tempDate.getTime())) {
        parsedDate = tempDate;
      }
    }

    const sms = await IncomingSms.create({
      sessionId,
      from,
      body,
      receivedAt: parsedDate
    });

    // Optionally, do additional processing or notification here

    return res.status(201).json({ success: true, data: sms });
  } catch (err) {
    console.error('[INCOMING_SMS]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.listSmsBySession = async (req, res) => {
  try {
    // accept from query, body or params
    let sessionIdRaw = req.query.sessionId || req.body?.sessionId || req.params?.sessionId;

    // normalize many shapes: string, array, { sessionId: '...' }, { 'sessionId': ['...'] } etc.
    let sessionId = '';
    if (sessionIdRaw == null) {
      sessionId = '';
    } else if (typeof sessionIdRaw === 'string') {
      sessionId = sessionIdRaw.trim();
    } else if (Array.isArray(sessionIdRaw)) {
      sessionId = String(sessionIdRaw[0] ?? '').trim();
    } else if (typeof sessionIdRaw === 'object') {
      // prefer nested .sessionId then first value
      sessionId = String(sessionIdRaw.sessionId ?? Object.values(sessionIdRaw)[0] ?? '').trim();
    } else {
      sessionId = String(sessionIdRaw).trim();
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId format.' });
    }

    const msgs = await IncomingSms.find({ sessionId })
      .sort({ receivedAt: -1 });

    return res.json({ success: true, data: msgs });
  } catch (err) {
    console.error('[LIST_INCOMING_SMS]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

