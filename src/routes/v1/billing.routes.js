const router = require('express').Router();
const controller = require('../../controllers/billing.controller');
const auth = require('../../middlewares/auth.middleware');
const checkRole = require('../../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Billing
 *
 * /billing:
 *   get:
 *     summary: List invoices (Admin/Receptionist)
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Invoices fetched }
 *   post:
 *     summary: Create an invoice
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Invoice created }
 *
 * /billing/{id}:
 *   get:
 *     summary: Get an invoice by id
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Invoice fetched }
 *
 * /billing/{id}/status:
 *   put:
 *     summary: Update invoice status
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Invoice status updated }
 */
router.post('/', auth, checkRole('RECEPTIONIST', 'ADMIN'), controller.createBilling);
router.get('/', auth, checkRole('ADMIN', 'RECEPTIONIST'), controller.getAllBillings);
router.get('/:id', auth, controller.getBillingById);
router.put('/:id/status', auth, checkRole('ADMIN', 'RECEPTIONIST'), controller.updateBillingStatus);

module.exports = router;
