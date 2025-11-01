const Session = require('../models/SessionSchema');
const Device = require('../models/DeviceSchema');
const fcmService = require('../services/fcm');
const selectionService = require('../services/selection');
const mongoose = require('mongoose');

exports.createSession = async (req, res) => {
  try {
    const { userId, ttlSeconds = 600, preferredDeviceId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const ttlMs = Number(ttlSeconds) * 1000;
    const expiresAt = new Date(Date.now() + (Number.isFinite(ttlMs) ? ttlMs : 600000));

    let device = null;

    // 1) Try preferred device if valid and online
    if (preferredDeviceId && mongoose.Types.ObjectId.isValid(preferredDeviceId)) {
      device = await Device.findOne({ _id: preferredDeviceId, status: 'online' });
    }

    // 2) Use selectionService
    if (!device) {
      const candidate = await selectionService.selectAvailableDevice().catch((err) => {
        console.error('[CREATE_SESSION] selectionService error:', err);
        return null;
      });

      if (candidate) {
        device = candidate.save ? candidate : await Device.findById(candidate._id);
        if (device && device.status !== 'online') device = null;
      }
    }

    // 3) Fallback query
    if (!device) {
      device = await Device.findOne({ status: 'online' }).sort({ updatedAt: 1 });
    }

    if (!device) {
      const onlineCount = await Device.countDocuments({ status: 'online' });
      return res.status(503).json({ error: 'No available relay device online', onlineCount });
    }

    const session = await Session.create({
      userId,
      assignedDeviceId: device._id,
      state: 'active',
      expiresAt,
      startedAt: new Date()
    });

    const deviceUpdate = {
      status: 'busy',
      assignedSessionId: session._id,
      lastAssignedAt: new Date()
    };
    if (Array.isArray(device.assignedSessionIds)) {
      deviceUpdate.$addToSet = { assignedSessionIds: session._id };
    }

    await Device.updateOne({ _id: device._id }, deviceUpdate);

    try {
      await fcmService.sendToDevice(device.fcmToken, {
        type: 'start_session',
        sessionId: session._id.toString(),
        userId,
        expiresAt: expiresAt.toISOString()
      });
    } catch (fcmErr) {
      console.error('[CREATE_SESSION] FCM send failed:', fcmErr);
      await Device.updateOne(
        { _id: device._id },
        {
          status: 'online',
          assignedSessionId: null,
          ...(Array.isArray(device.assignedSessionIds) ? { $pull: { assignedSessionIds: session._id } } : {})
        }
      );
      await Session.findByIdAndDelete(session._id).catch(() => {});
      return res.status(502).json({ error: 'Failed to contact relay device' });
    }

    return res.json(session);
  } catch (err) {
    console.error('[CREATE_SESSION] unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.stopSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session || session.state !== 'active') {
      return res.status(404).json({ error: 'Session not found or inactive' });
    }

    // Update session
    session.state = 'stopped';
    session.stoppedAt = new Date();
    await session.save();

    // Free assigned device
    const device = await Device.findById(session.assignedDeviceId);
    if (device) {
      device.status = 'online';
      device.assignedSessionId = null;
      await device.save();

      // Optional: notify device via FCM to stop current session
      try {
        await fcmService.sendToDevice(device.fcmToken, {
          type: 'stop_session',
          sessionId: session._id.toString()
        });
      } catch (fcmErr) {
        console.error('[STOP_SESSION] FCM send failed:', fcmErr);
      }
    }

    res.json({ success: true, message: 'Session stopped and device released' });
  } catch (err) {
    console.error('[STOP_SESSION]', err);
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

