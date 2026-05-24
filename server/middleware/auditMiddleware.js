const AuditLog = require('../models/AuditLog');

const audit = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    try {
      await AuditLog.create({
        user: req.user?._id,
        action,
        resource,
        resourceId: req.params.id,
        details: { method: req.method, body: req.body, query: req.query },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: res.statusCode < 400 ? 'success' : 'failure',
      });
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
    return originalJson(data);
  };
  next();
};

module.exports = { audit };
