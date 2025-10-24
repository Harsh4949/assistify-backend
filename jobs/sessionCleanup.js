const Session = require('../models/SessionSchema');
const Device = require('../models/DeviceSchema');

async function releaseExpiredSessions() {
  const now = new Date();
  const expiredSessions = await Session.find({ expiresAt: { $lt: now }, state: 'active' });

  for (const sess of expiredSessions) {
    sess.state = 'expired';
    sess.stoppedAt = new Date();
    await sess.save();

    const device = await Device.findById(sess.assignedDeviceId);
    if (device) {
      device.status = 'online';
      device.assignedSessionId = null;
      await device.save();

      console.log(`[CLEANUP] Device ${device._id} released from expired session ${sess._id}`);
    }
  }
}

module.exports = { releaseExpiredSessions };
