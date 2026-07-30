const { body } = require('express-validator');

exports.createPatientRules = [
  body('userId').isInt().withMessage('userId must be an integer'),
  body('dob').isISO8601().withMessage('dob must be a valid date'),
  body('gender').isIn(['MALE', 'FEMALE']).withMessage('gender must be MALE or FEMALE'),
  body('phone').notEmpty().withMessage('phone is required'),
  body('address').notEmpty().withMessage('address is required'),
];
