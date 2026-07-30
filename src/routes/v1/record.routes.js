const router = require('express').Router();
const controller = require('../../controllers/record.controller');
const auth = require('../../middlewares/auth.middleware');
const checkRole = require('../../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Medical Records
 *
 * /records:
 *   post:
 *     summary: Create a medical record (Doctor only)
 *     tags: [Medical Records]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Record created }
 *
 * /records/patient/{patientId}:
 *   get:
 *     summary: Get all medical records for a patient
 *     tags: [Medical Records]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Records fetched }
 *
 * /records/{id}:
 *   get:
 *     summary: Get a medical record by id
 *     tags: [Medical Records]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Record fetched }
 */
router.post('/', auth, checkRole('DOCTOR'), controller.createRecord);
router.get('/patient/:patientId', auth, controller.getRecordsByPatient);
router.get('/:id', auth, controller.getRecordById);
router.put('/:id', auth, checkRole('DOCTOR'), controller.updateRecord);
router.delete('/:id', auth, checkRole('ADMIN'), controller.deleteRecord);

module.exports = router;
