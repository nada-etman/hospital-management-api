const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const {
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
} = require('../utils/token.util');
const { sendEmail } = require('../utils/email.util');
const { NotFoundError, UnauthorizedError, ConflictError } = require('../errors');
const { clientUrl } = require('../config/env');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email is already registered');

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = generateRandomToken();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        verifyToken,
        verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const link = `${clientUrl}/verify-email?token=${verifyToken}`;
    await sendEmail(email, 'Verify your email', `<a href="${link}">Click here to verify your account</a>`);

    return ApiResponse.success(res, {
      message: 'User created. Check your email to verify your account.',
      data: { userId: user.id },
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await prisma.user.findFirst({
      where: { verifyToken: token, verifyTokenExpiry: { gt: new Date() } },
    });
    if (!user) return next(new UnauthorizedError('Invalid or expired verification token'));

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null, verifyTokenExpiry: null },
    });

    return ApiResponse.success(res, { message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.isDeleted) throw new NotFoundError('User');
    if (!user.isVerified) throw new UnauthorizedError('Please verify your email before logging in');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedError('Invalid credentials');

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshTokenValue = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, {
      message: 'Login successful',
      data: { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw new UnauthorizedError('No refresh token provided');

    const stored = await prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const accessToken = generateAccessToken({ id: stored.user.id, role: stored.user.role });
    return ApiResponse.success(res, { message: 'Token refreshed', data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) await prisma.refreshToken.deleteMany({ where: { token } });
    res.clearCookie('refreshToken');
    return ApiResponse.success(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Respond the same way whether or not the user exists, to avoid leaking which emails are registered.
    if (user) {
      const resetToken = generateRandomToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
      });

      const link = `${clientUrl}/reset-password?token=${resetToken}`;
      await sendEmail(email, 'Reset your password', `<a href="${link}">Click here to reset your password</a>`);
    }

    return ApiResponse.success(res, { message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw new UnauthorizedError('Invalid or expired reset token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });

    return ApiResponse.success(res, { message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};
