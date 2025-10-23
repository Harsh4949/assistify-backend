const Device = require('../models/DeviceSchema');
const DeviceHeartbeat = require('../models/DeviceHeartbeatSchema');
const Message = require('../models/MessageSchema');
const fcmService = require('../services/fcm');

exports.register = async (req, res) => {
  try {
    const { fcmToken, model, capabilities, appVersion, deviceKeyHash } = req.body;
    if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' });

    let device = await Device.findOne({ fcmToken });
    if (!device) {
      device = new Device({ fcmToken, model, capabilities, appVersion, status: 'online', secrets: { deviceKeyHash } });
    } else {
      device.model = model;
      device.capabilities = capabilities;
      device.appVersion = appVersion;
      device.status = 'online';
      device.secrets.deviceKeyHash = deviceKeyHash;
    }
    await device.save();

    res.json({ deviceId: device._id, status: device.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.heartbeat = async (req, res) => {
  try {
    const { deviceId, battery, network, queueDepth } = req.body;
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    device.lastHeartbeatAt = new Date();
    device.battery = battery;
    device.network = network;
    await device.save();

    const hbEntry = new DeviceHeartbeat({
      deviceId,
      metrics: { battery, networkType: network, queueDepth }
    });
    await hbEntry.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.ack = async (req, res) => {
  try {
    const { deviceId, commandId, pingId, status, message } = req.body;

    // Validate deviceId
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Find device
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Update lastHeartbeatAt / lastAckTime
    device.lastHeartbeatAt = new Date();
    device.status = 'online';
    await device.save();

    // Optionally store quick boolean/metrics entry for ACK history
    await DeviceHeartbeat.create({
      deviceId: deviceId,
      metrics: {
        battery: device.battery || null,
        networkType: device.network || 'unknown',
        queueDepth: 0
      },
      at: new Date()
    });

    // Log ack details
    console.log(`[ACK] Device ${deviceId} (${device.model}) -> ${status || 'ok'} : ${commandId || pingId || 'ping'}`);

    // Optional: respond differently for pings
    if (pingId) {
      return res.json({
        ok: true,
        ackType: 'ping',
        pingId,
        message: message || 'Ping acknowledgment received',
        timestamp: new Date()
      });
    }

    // Otherwise, normal command ack
    res.json({
      ok: true,
      ackType: 'command',
      commandId,
      message: message || 'Command acknowledgment received',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[ACK_ERROR]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.smsResult = async (req, res) => {
  try {
    const { msgId, status, providerMessageId, sentAt, deliveredAt, error } = req.body;
    const message = await Message.findById(msgId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.status = status;
    if (providerMessageId) message.providerMessageId = providerMessageId;
    if (sentAt) message.sentAt = new Date(sentAt);
    if (deliveredAt) message.deliveredAt = new Date(deliveredAt);
    if (error) message.lastError = error;

    await message.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
