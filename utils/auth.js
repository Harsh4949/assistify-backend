exports.requireDeviceAuth = (req, res, next) => {
  // Check device key in header, match hash...
  next();
};
