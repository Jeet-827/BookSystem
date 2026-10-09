import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setCookies,
  clearCookies,
  REFRESH_SECRET,
} from '../utils/generateTokens.js';
import { formatUser, sanitizeEmail } from '../utils/helpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Helper to hash token string before storing in DB
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const safeEmail = sanitizeEmail(email);

  const existingUser = await User.findOne({ email: safeEmail });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'User with this email already exists' });
  }

  const user = await User.create({
    name: String(name).trim(),
    email: safeEmail,
    password: String(password),
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh session in DB
  await RefreshSession.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.socket.remoteAddress || '',
  });

  setCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    accessToken,
    user: formatUser(user),
  });
});

// @desc    Login user / admin
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const safeEmail = sanitizeEmail(email);

  const user = await User.findOne({ email: safeEmail });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(String(password));
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Record session
  await RefreshSession.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.socket.remoteAddress || '',
  });

  setCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    accessToken,
    user: formatUser(user),
  });
});

// @desc    Refresh access token & rotate refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    const tokenHashed = hashToken(token);

    // Verify active session exists and is not revoked
    const session = await RefreshSession.findOne({
      userId: decoded.id,
      tokenHash: tokenHashed,
      revokedAt: null,
    });

    if (!session) {
      clearCookies(res);
      return res.status(401).json({ success: false, message: 'Refresh session revoked or invalid' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      clearCookies(res);
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // Revoke old session and issue new rotated refresh token
    session.revokedAt = new Date();
    await session.save();

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    await RefreshSession.create({
      userId: user._id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.socket.remoteAddress || '',
    });

    setCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
      user: formatUser(user),
    });
  } catch (error) {
    clearCookies(res);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// @desc    Logout user & revoke session
// @route   POST /api/auth/logout
// @access  Public
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token) {
    const tokenHashed = hashToken(token);
    await RefreshSession.updateOne({ tokenHash: tokenHashed }, { $set: { revokedAt: new Date() } });
  }
  clearCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: formatUser(req.user) });
});
