const Message = require('../models/MessageSchema');
const Session = require('../models/SessionSchema');
const Device = require('../models/DeviceSchema');
const fcmService = require('../services/fcm');

exports.enqueueMessage = async (req, res) => {
  try {
    const { sessionId, to, body } = req.body;
    const session = await Session.findById(sessionId);
    if (!session || session.state !== 'active') {
      return res.status(400).json({ error: 'Invalid or inactive session' });
    }

    const device = await Device.findById(session.assignedDeviceId);
    if (!device) {
      return res.status(500).json({ error: 'Assigned device not found' });
    }

    // Create message with status 'queued'
    const message = new Message({ sessionId, to, body, status: 'queued', deviceId: device._id });
    await message.save();

    // Send FCM 'send_sms' command
    await fcmService.sendToDevice(device.fcmToken, {
      type: 'send_sms',
      sessionId,
      to,
      body,
      msgId: message._id.toString(),
      requireDeliveryReport: true
    });

    // Update message status to 'dispatched'
    message.status = 'dispatched';
    await message.save();

    res.json(message);
  } catch (err) {
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
