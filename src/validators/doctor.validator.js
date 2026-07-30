const { body } = require('express-validator');

exports.createDoctorRules = [
  body('userId').isInt().withMessage('userId must be an integer'),
  body('specialization').notEmpty().withMessage('specialization is required'),
  body('licenseNo').notEmpty().withMessage('licenseNo is required'),
  body('departmentId').isInt().withMessage('departmentId must be an integer'),
];
