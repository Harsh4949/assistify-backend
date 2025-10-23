const Message = require('../models/MessageSchema');
const Session = require('../models/SessionSchema');
const Device = require('../models/DeviceSchema');
const fcmService = require('../services/fcm');

exports.enqueueMessage = async (req, res) => {
  try {
    const { sessionId, to, body } = req.body;
    console.log('[ENQUEUE_SMS] sessionId:', sessionId, 'to:', to);

    const session = await Session.findById(sessionId);
    if (!session || session.state !== 'active') {
      console.log('[ENQUEUE_SMS] No valid (active) session found:', sessionId);
      return res.status(400).json({ error: 'Invalid or inactive session' });
    }

    const device = await Device.findById(session.assignedDeviceId);
    if (!device || !device.fcmToken) {
      console.log('[ENQUEUE_SMS] No device/fcmToken:', session.assignedDeviceId);
      return res.status(500).json({ error: 'Assigned device not found or missing FCM token' });
    }

    const message = new Message({ sessionId, to, body, status: 'queued', deviceId: device._id });
    await message.save();
    console.log('[ENQUEUE_SMS] Created message:', message._id);

    try {
      // Send FCM 'send_sms' command
      const fcmResult = await fcmService.sendToDevice(device.fcmToken, {
        type: 'send_sms',
        sessionId: sessionId.toString(),
        to: to.toString(),
        body: body.toString(),
        msgId: message._id.toString(),
        requireDeliveryReport: 'true'
      });
      console.log('[ENQUEUE_SMS] FCM sent successfully, result:', fcmResult);


      message.status = 'dispatched';
      await message.save();

      res.json(message);
    } catch (fcmErr) {
      console.error('[ENQUEUE_SMS] FCM send error:', fcmErr);
      res.status(500).json({ error: 'FCM send failed: ' + fcmErr.message });
    }
  } catch (err) {
    console.error('[ENQUEUE_SMS] General error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
