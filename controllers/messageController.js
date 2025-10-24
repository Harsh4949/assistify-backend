const Message = require('../models/MessageSchema');
const Session = require('../models/SessionSchema');
const Device = require('../models/DeviceSchema');
const fcmService = require('../services/fcm');



exports.getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




exports.enqueueMessage = async (req, res) => {
  try {
    const { sessionId, to, body } = req.body;
    if (!sessionId || !to || !body) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Validate active session
    const session = await Session.findById(sessionId);
    if (!session || session.state !== 'active') {
      return res.status(400).json({ error: 'Invalid or inactive session' });
    }

    // Find device assigned to session
    const device = await Device.findById(session.assignedDeviceId);
    if (!device) {
      return res.status(500).json({ error: 'Assigned device not found' });
    }

    // Create message
    const message = new Message({
      sessionId,
      deviceId: device._id,
      to,
      body,
      status: 'queued'
    });
    await message.save();

    // Send send_sms command via FCM
    await fcmService.sendToDevice(device.fcmToken, {
      type: 'send_sms',
      sessionId: sessionId.toString(),
      to,
      body,
      msgId: message._id.toString(),
      requireDeliveryReport: 'true'
    });

    // Mark message dispatched
    message.status = 'dispatched';
    await message.save();

    res.json(message);

  } catch (err) {
    console.error('[ENQUEUE_MESSAGE]', err);
    res.status(500).json({ error: err.message });
  }
};

exports.smsResult = async (req, res) => {
  try {
    const { msgId, status, sentAt, deliveredAt, error, sessionId } = req.body;

    if (!msgId) {
      return res.status(400).json({ error: 'msgId is required' });
    }

    const message = await Message.findById(msgId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Update message status + timestamps
    if (status) message.status = status;
    if (sentAt) message.sentAt = new Date(Number(sentAt));
    if (deliveredAt) message.deliveredAt = new Date(Number(deliveredAt));
    if (error) message.error = error;

    // Optionally update sessionId if provided and differs
    if (sessionId && sessionId !== message.sessionId.toString()) {
      message.sessionId = sessionId;
    }

    await message.save();

    console.log(`[SMS_RESULT] msgId: ${msgId}, status: ${status}`);

    res.json({ ok: true });
  } catch (err) {
    console.error('[SMS_RESULT]', err);
    res.status(500).json({ error: err.message });
  }
};
