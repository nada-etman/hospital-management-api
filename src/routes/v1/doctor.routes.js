const router = require('express').Router();
const controller = require('../../controllers/doctor.controller');
const auth = require('../../middlewares/auth.middleware');
const checkRole = require('../../middlewares/role.middleware');
const { validateRules } = require('../../middlewares/validate.middleware');
const { createDoctorRules } = require('../../validators/doctor.validator');

/**
 * @swagger
 * tags:
 *   name: Doctors
 *
 * /doctors:
 *   get:
 *     summary: List doctors (supports specialization, departmentId, search, page, limit)
 *     tags: [Doctors]
 *     responses:
 *       200: { description: Doctors fetched }
 *   post:
 *     summary: Create a doctor profile (Admin only)
 *     tags: [Doctors]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Doctor created }
 *
 * /doctors/{id}:
 *   get:
 *     summary: Get a doctor by id
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Doctor fetched }
 *       404: { description: Not found }
 */
router.get('/', controller.getAllDoctors);
router.get('/:id', controller.getDoctorById);
router.post('/', auth, checkRole('ADMIN'), createDoctorRules, validateRules, controller.createDoctor);
router.put('/:id', auth, checkRole('ADMIN', 'DOCTOR'), controller.updateDoctor);
router.delete('/:id', auth, checkRole('ADMIN'), controller.deleteDoctor);

module.exports = router;
