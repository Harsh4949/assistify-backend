const express = require('express');
const router = express.Router();
const { generatePairingPayload, sha256Hex } = require('../utils/keygen');
const fcmService = require('../services/fcm');
const AssistifyDevice = require('../models/AssistifyModel/AssistifyDeviceSchema');

/**
 * POST /api/pair/generate
 * Protected endpoint (verify Firebase token). The web dashboard calls this.
 * Returns pairing payload JSON which will be rendered as QR.
 */
router.post('/generate', fcmService.verifyIdToken, async (req, res) => {
  try {
    const payload = generatePairingPayload(process.env.QR_EXPIRES_MINUTES ? parseInt(process.env.QR_EXPIRES_MINUTES) : 5);
    // store pending entry with keyId + deviceKeyHash (store hashed key)
    const keyBuffer = Buffer.from(payload.aesKey, 'base64');
    const deviceKeyHash = sha256Hex(keyBuffer);

    // Save pending pairing record using keyId (no deviceId yet)
    await AssistifyDevice.findOneAndUpdate(
      { keyId: payload.keyId },
      {
        $set: {
          keyId: payload.keyId,
          deviceKeyHash: deviceKeyHash,
          status: 'pending',
          userId: req.uid
        }
      },
      { upsert: true }
    );

    // Return payload to web (web shows as QR)
    return res.json({ ok: true, payload });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
