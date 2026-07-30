const { body } = require('express-validator');

exports.createAppointmentRules = [
  body('patientId').isInt().withMessage('patientId must be an integer'),
  body('doctorId').isInt().withMessage('doctorId must be an integer'),
  body('date').isISO8601().withMessage('date must be a valid ISO date'),
  body('reason').trim().notEmpty().withMessage('reason is required'),
];
