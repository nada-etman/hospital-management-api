const router = require('express').Router();
const controller = require('../../controllers/stats.controller');
const auth = require('../../middlewares/auth.middleware');
const checkRole = require('../../middlewares/role.middleware');

/**
 * @swagger
 * /stats/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Stats]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Stats fetched }
 */
router.get('/dashboard', auth, checkRole('ADMIN'), controller.getDashboardStats);

module.exports = router;
