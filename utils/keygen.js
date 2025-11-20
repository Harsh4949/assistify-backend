const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

function generatePairingPayload(expiresMinutes = 5) {
  const keyId = uuidv4();
  const aesKey = crypto.randomBytes(32); // 256-bit key
  const aesKeyBase64 = aesKey.toString('base64');
  const now = Date.now();
  const expiresAt = now + (expiresMinutes * 60 * 1000);
  return {
    keyId,
    aesKey: aesKeyBase64,
    createdAt: now,
    expiresAt
  };
}

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { generatePairingPayload, sha256Hex };
