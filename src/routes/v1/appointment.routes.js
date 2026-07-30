const router = require('express').Router();
const controller = require('../../controllers/appointment.controller');
const auth = require('../../middlewares/auth.middleware');
const checkRole = require('../../middlewares/role.middleware');
const { validateRules } = require('../../middlewares/validate.middleware');
const { createAppointmentRules } = require('../../validators/appointment.validator');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *
 * /appointments:
 *   get:
 *     summary: List appointments (filter by status, doctorId, patientId)
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Appointments fetched }
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, doctorId, date, reason]
 *             properties:
 *               patientId: { type: integer, example: 3 }
 *               doctorId: { type: integer, example: 7 }
 *               date: { type: string, format: date-time, example: "2026-07-25T10:00:00Z" }
 *               reason: { type: string, example: "Follow-up checkup" }
 *     responses:
 *       201: { description: Appointment booked }
 *       409: { description: Time slot already booked }
 *
 * /appointments/{id}:
 *   get:
 *     summary: Get an appointment by id
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Appointment fetched }
 *
 * /appointments/{id}/status:
 *   put:
 *     summary: Update appointment status
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED] }
 *     responses:
 *       200: { description: Status updated }
 */
router.post(
  '/',
  auth,
  checkRole('PATIENT', 'RECEPTIONIST'),
  createAppointmentRules,
  validateRules,
  controller.createAppointment
);
router.get('/', auth, controller.getAllAppointments);
router.get('/:id', auth, controller.getAppointmentById);
router.put('/:id/status', auth, checkRole('DOCTOR', 'ADMIN', 'RECEPTIONIST'), controller.updateStatus);
router.delete('/:id', auth, checkRole('ADMIN'), controller.deleteAppointment);

module.exports = router;
