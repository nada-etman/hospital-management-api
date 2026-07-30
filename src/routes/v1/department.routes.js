const router = require('express').Router();
const controller = require('../../controllers/department.controller');
const auth = require('../../middlewares/auth.middleware');
const checkRole = require('../../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Departments
 *
 * /departments:
 *   get:
 *     summary: List all departments
 *     tags: [Departments]
 *     responses:
 *       200: { description: Departments fetched }
 *   post:
 *     summary: Create a department (Admin only)
 *     tags: [Departments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Cardiology" }
 *               description: { type: string }
 *     responses:
 *       201: { description: Department created }
 *       403: { description: Forbidden }
 *
 * /departments/{id}:
 *   get:
 *     summary: Get a department by id
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Department fetched }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a department (Admin only)
 *     tags: [Departments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Department updated }
 *   delete:
 *     summary: Delete a department (Admin only)
 *     tags: [Departments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Department deleted }
 */
router.get('/', controller.getAllDepartments);
router.get('/:id', controller.getDepartmentById);
router.post('/', auth, checkRole('ADMIN'), controller.createDepartment);
router.put('/:id', auth, checkRole('ADMIN'), controller.updateDepartment);
router.delete('/:id', auth, checkRole('ADMIN'), controller.deleteDepartment);

module.exports = router;
