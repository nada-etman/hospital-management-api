const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/patients', require('./patient.routes'));
router.use('/doctors', require('./doctor.routes'));
router.use('/departments', require('./department.routes'));
router.use('/appointments', require('./appointment.routes'));
router.use('/records', require('./record.routes'));
router.use('/billing', require('./billing.routes'));
router.use('/stats', require('./stats.routes'));

module.exports = router;
