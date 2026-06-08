exports.success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

exports.error = (res, statusCode, errorCode, message) =>
  res.status(statusCode).json({ success: false, error: errorCode, message });
