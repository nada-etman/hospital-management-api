const { ForbiddenError, UnauthorizedError } = require('../errors');

// Simple, explicit role-based access control.
// Usage: checkRole('ADMIN', 'DOCTOR')
module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`));
  }
  next();
};
