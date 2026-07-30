const prisma = require('../config/db');
const logger = require('../config/logger');

// Fires-and-forgets an audit log entry after a successful response.
module.exports = (action, entity) => (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) {
      prisma.auditLog
        .create({
          data: {
            userId: req.user?.id,
            action,
            entity,
            entityId: Number(req.params.id) || body?.data?.id || null,
            details: req.body,
            ipAddress: req.ip,
          },
        })
        .catch((err) => logger.error(`Audit log failed: ${err.message}`));
    }
    return originalJson(body);
  };
  next();
};
