const Device = require('../models/DeviceSchema');

exports.selectAvailableDevice = async () => {
  return Device.findOne({ status: 'online', assignedSessionId: null }).sort({ lastHeartbeatAt: -1 });
};
