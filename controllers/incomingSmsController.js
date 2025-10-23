const IncomingSms = require('../models/IncomingSmsSchema');
const Session = require('../models/SessionSchema');

/**
 * POST /api/v1/incoming-sms
 * {
 *   sessionId: "SESSION_OBJECT_ID",
 *   from: "+911234567890",
 *   body: "SMS text here",
 *   receivedAt: <timestamp> (optional)
 * }
 */
exports.receiveSms = async (req, res) => {
  try {
    const { sessionId, from, body, receivedAt } = req.body;

    if (!sessionId || !from || !body) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const session = await Session.findById(sessionId);
    if (!session || session.state !== 'active') {
      return res.status(400).json({ error: 'Invalid or inactive session.' });
    }

    const sms = await IncomingSms.create({
      sessionId,
      from,
      body,
      receivedAt: receivedAt ? new Date(Number(receivedAt)) : new Date()
    });

    // Optionally, do additional processing or notification here

    res.json({ success: true, data: sms });
  } catch (err) {
    console.error('[INCOMING_SMS]', err);
    res.status(500).json({ error: err.message });
  }
};


exports.listSmsBySession = async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required.' });
    }
    const msgs = await IncomingSms.find({ sessionId })
      .sort({ receivedAt: -1 });
    res.json({ success: true, data: msgs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

