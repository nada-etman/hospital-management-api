const logger = require('../config/logger');
const ApiResponse = require('../utils/apiResponse');

module.exports = (err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  });

  // Prisma known error codes
  if (err.code === 'P2002') {
    return ApiResponse.error(res, {
      message: 'Duplicate value',
      statusCode: 409,
      errors: [{ field: err.meta?.target?.[0], message: 'This value already exists' }],
    });
  }
  if (err.code === 'P2025') {
    return ApiResponse.error(res, { message: 'Record not found', statusCode: 404 });
  }
  if (err.code === 'P2003') {
    return ApiResponse.error(res, { message: 'Related record does not exist', statusCode: 400 });
  }

  // Our own operational errors
  if (err.isOperational) {
    return ApiResponse.error(res, {
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors || null,
    });
  }

  // Unknown / programming errors — don't leak internals in production
  return ApiResponse.error(res, {
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    statusCode: 500,
  });
};
