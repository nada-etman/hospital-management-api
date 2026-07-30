const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

// For express-validator rule arrays
exports.validateRules = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, {
      message: 'Validation failed',
      statusCode: 400,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// For Joi schemas
exports.validateSchema = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return ApiResponse.error(res, {
      message: 'Validation failed',
      statusCode: 400,
      errors: error.details.map((d) => ({ field: d.path[0], message: d.message })),
    });
  }
  next();
};
