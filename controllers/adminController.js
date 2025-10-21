const Device = require('../models/DeviceSchema');
const Session = require('../models/SessionSchema');
const Message = require('../models/MessageSchema');
const fcmService = require('../services/fcm');

exports.getMetrics = async (req, res) => {
  try {
    const onlineCount = await Device.countDocuments({ status: 'online' });
    const activeSessions = await Session.countDocuments({ state: 'active' });
    const queuedMessages = await Message.countDocuments({ status: 'queued' });
    const failedMessages = await Message.countDocuments({ status: 'failed' });

    res.json({
      devicesOnline: onlineCount,
      activeSessions,
      messagesQueued: queuedMessages,
      messagesFailed: failedMessages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pingDevice = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    await fcmService.sendToDevice(device.fcmToken, {
      type: 'ping',
      pingId: Math.random().toString(36).substring(2),
      requestedAt: new Date().toISOString()
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
