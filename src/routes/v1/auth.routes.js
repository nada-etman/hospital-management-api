const router = require('express').Router();
const authController = require('../../controllers/auth.controller');
const { validateRules } = require('../../middlewares/validate.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require('../../validators/auth.validator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login and password management
 *
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string, example: "Ahmed Ali" }
 *               email: { type: string, example: "ahmed@example.com" }
 *               password: { type: string, example: "secret123" }
 *               role: { type: string, enum: [ADMIN, DOCTOR, PATIENT, RECEPTIONIST] }
 *     responses:
 *       201: { description: User created, verification email sent }
 *       400: { description: Validation error }
 *       409: { description: Email already registered }
 */
router.post('/register', registerRules, validateRules, authController.register);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify a user's email using the token sent by email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Email verified }
 *       401: { description: Invalid or expired token }
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive an access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials or unverified email }
 *       404: { description: User not found }
 */
router.post('/login', authLimiter, loginRules, validateRules, authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Exchange the refresh-token cookie for a new access token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Token refreshed }
 *       401: { description: Missing/invalid/expired refresh token }
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and invalidate the refresh token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Reset link sent if the email exists }
 */
router.post('/forgot-password', authLimiter, forgotPasswordRules, validateRules, authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset the password using a valid reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password reset successful }
 *       401: { description: Invalid or expired token }
 */
router.post('/reset-password', resetPasswordRules, validateRules, authController.resetPassword);

module.exports = router;
