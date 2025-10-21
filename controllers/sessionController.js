const Session = require('../models/SessionSchema');
const Device = require('../models/DeviceSchema');
const fcmService = require('../services/fcm');
const selectionService = require('../services/selection');

exports.createSession = async (req, res) => {
  try {
    const { userId, ttlSeconds, preferredDeviceId } = req.body;
    const expiresAt = new Date(Date.now() + (ttlSeconds || 600) * 1000);

    // Select device (preferred or best available)
    let device = null;
    if (preferredDeviceId) device = await Device.findById(preferredDeviceId);
    if (!device || device.status !== 'online') {
      device = await selectionService.selectAvailableDevice();
    }
    if (!device) return res.status(503).json({ error: 'No available relay device online' });

    // Create session
    const session = new Session({
      userId,
      assignedDeviceId: device._id,
      state: 'active',
      expiresAt,
      startedAt: new Date()
    });

    await session.save();

    // Mark device busy
    device.status = 'busy';
    device.assignedSessionId = session._id;
    await device.save();

    // Send start_session command via FCM
    await fcmService.sendToDevice(device.fcmToken, {
      type: 'start_session',
      sessionId: session._id.toString(),
      userId,
      expiresAt: expiresAt.toISOString()
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stopSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.state !== 'active') {
      return res.status(400).json({ error: 'Session not active' });
    }

    session.state = 'stopping';
    session.stoppedAt = new Date();
    await session.save();

    const device = await Device.findById(session.assignedDeviceId);
    if (device) {
      await fcmService.sendToDevice(device.fcmToken, {
        type: 'stop_session',
        sessionId: session._id.toString()
      });
      device.status = 'online';
      device.assignedSessionId = null;
      await device.save();
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('assignedDeviceId').exec();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
