const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret, jwtAccessExpiry } = require('../config/env');

exports.generateAccessToken = (payload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: jwtAccessExpiry });

exports.verifyAccessToken = (token) => jwt.verify(token, jwtSecret);

exports.generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

exports.generateRandomToken = () => crypto.randomBytes(32).toString('hex');
