const express = require('express');
const router = express.Router();
const fcmService = require('../services/fcm');
const AssistifyDevice = require('../models/AssistifyModel/AssistifyDeviceSchema');

/**
 * POST /api/devices/register
 * Body: { deviceId, keyId, deviceKeyHash, fcmToken, model, capabilities }
 * Auth: Firebase ID token (Bearer)
 */
router.post('/register', fcmService.verifyIdToken, async (req, res) => {
  const { deviceId, keyId, deviceKeyHash, fcmToken, model, capabilities } = req.body;
  if (!deviceId || !keyId || !deviceKeyHash) return res.status(400).json({ error: 'Missing fields' });

  try {
    // Verify a pending pairing exists for this keyId and same user
    const pending = await AssistifyDevice.findOne({ keyId });
    if (!pending) {
      return res.status(404).json({ error: 'Pairing not found' });
    }
    if (pending.deviceKeyHash !== deviceKeyHash) {
      return res.status(403).json({ error: 'Key mismatch' });
    }

    const now = new Date();
    const doc = await AssistifyDevice.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          userId: req.uid,
          keyId,
          deviceKeyHash,
          fcmToken,
          model,
          capabilities,
          status: 'paired',
          pairedAt: now,
          lastSeenAt: now
        }
      },
      { upsert: true, new: true }
    );

    return res.json({ ok: true, deviceId: doc.deviceId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/devices/:deviceId
 */
router.get('/:deviceId', fcmService.verifyIdToken, async (req, res) => {
  try {
    const doc = await AssistifyDevice.findOne({ deviceId: req.params.deviceId, userId: req.uid }).lean();
    if (!doc) return res.status(404).json({ ok: false, error: 'not found' });
    return res.json({ ok: true, device: doc });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
