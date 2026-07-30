const router = require('express').Router();
const controller = require('../../controllers/patient.controller');
const auth = require('../../middlewares/auth.middleware');
const checkRole = require('../../middlewares/role.middleware');
const { validateRules } = require('../../middlewares/validate.middleware');
const { createPatientRules } = require('../../validators/patient.validator');
const auditLog = require('../../middlewares/audit.middleware');

/**
 * @swagger
 * tags:
 *   name: Patients
 *
 * /patients:
 *   get:
 *     summary: List patients (paginated, searchable)
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Patients fetched }
 *   post:
 *     summary: Create a patient profile
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, dob, gender, phone, address]
 *             properties:
 *               userId: { type: integer, example: 5 }
 *               dob: { type: string, format: date, example: "1995-03-20" }
 *               gender: { type: string, enum: [MALE, FEMALE] }
 *               phone: { type: string, example: "01012345678" }
 *               address: { type: string, example: "Cairo, Egypt" }
 *               bloodType: { type: string, example: "O+" }
 *     responses:
 *       201: { description: Patient created }
 *       400: { description: Validation error }
 *
 * /patients/{id}:
 *   get:
 *     summary: Get a patient by id
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Patient fetched }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a patient
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Patient updated }
 *   delete:
 *     summary: Soft-delete a patient (Admin only)
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Patient deleted }
 */
router.get('/', auth, checkRole('ADMIN', 'DOCTOR', 'RECEPTIONIST'), controller.getAllPatients);
router.get('/:id', auth, controller.getPatientById);
router.post(
  '/',
  auth,
  checkRole('ADMIN', 'RECEPTIONIST'),
  createPatientRules,
  validateRules,
  controller.createPatient
);
router.put('/:id', auth, controller.updatePatient);
router.delete('/:id', auth, checkRole('ADMIN'), auditLog('DELETE', 'Patient'), controller.deletePatient);

module.exports = router;
