import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import RefreshSession from '../models/RefreshSession.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setCookies,
  clearCookies,
  REFRESH_SECRET,
} from '../utils/generateTokens.js';
import { formatUser, sanitizeEmail } from '../utils/helpers.js';
import { validateGenuineEmail } from '../utils/emailValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';

// Helper to hash token string before storing in DB
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const safeEmail = sanitizeEmail(email);

  // Validate Genuine Email (Defense in depth)
  const emailValidation = validateGenuineEmail(safeEmail);
  if (!emailValidation.isValid) {
    return res.status(400).json({ success: false, message: emailValidation.message });
  }

  const existingUser = await User.findOne({ email: safeEmail });
  const existingAdmin = await Admin.findOne({ email: safeEmail });
  if (existingUser || existingAdmin) {
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
    refreshToken,
    user: formatUser(user),
  });
});

// @desc    Login user / admin
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const safeEmail = sanitizeEmail(email);

  // 1. Check if user is an Administrator in Admin collection
  let admin = await Admin.findOne({ email: safeEmail });
  if (admin) {
    const isMatch = await admin.comparePassword(String(password));
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (admin.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const accessToken = generateAccessToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);

    await RefreshSession.create({
      userId: admin._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.socket.remoteAddress || '',
    });

    setCookies(res, accessToken, refreshToken);

    return res.json({
      success: true,
      message: 'Admin login successful',
      user: formatUser(admin),
    });
  }

  // 2. Regular customer check in User collection
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
    refreshToken,
    user: formatUser(user),
  });
});

// @desc    Refresh access token & rotate refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.refreshToken ||
    req.cookies?.adminRefreshToken ||
    req.body?.refreshToken ||
    req.headers['x-refresh-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    const tokenHashed = hashToken(token);

    // Verify session has not been explicitly revoked
    const revokedSession = await RefreshSession.findOne({
      userId: decoded.id,
      tokenHash: tokenHashed,
      revokedAt: { $ne: null },
    });

    if (revokedSession) {
      // 60-second concurrency grace period for rapid page reloads or parallel tab requests
      const revokedTime = new Date(revokedSession.revokedAt).getTime();
      const isWithinGrace = Date.now() - revokedTime < 60 * 1000;

      if (!isWithinGrace) {
        clearCookies(res);
        return res.status(401).json({ success: false, message: 'Refresh session revoked' });
      }

      let user = await User.findById(decoded.id).select('-password');
      if (!user) user = await Admin.findById(decoded.id).select('-password');

      if (user) {
        const newAccessToken = generateAccessToken(user._id);
        setCookies(res, newAccessToken, token);
        return res.json({
          success: true,
          user: formatUser(user),
        });
      }
    }

    let user = await User.findById(decoded.id).select('-password');
    if (!user) {
      user = await Admin.findById(decoded.id).select('-password');
    }

    if (!user) {
      clearCookies(res);
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // Revoke old session if tracked
    const session = await RefreshSession.findOne({
      userId: decoded.id,
      tokenHash: tokenHashed,
      revokedAt: null,
    });

    if (session) {
      session.revokedAt = new Date();
      await session.save();
    }

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

// @desc    Change user / admin password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New password and confirmation password do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
  }

  let account = await Admin.findById(userId);
  if (!account) {
    account = await User.findById(userId);
  }

  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }

  const isMatch = await account.comparePassword(String(currentPassword));
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  account.password = String(newPassword);
  await account.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// @desc    Request password reset code
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address' });
  }

  const safeEmail = sanitizeEmail(email);
  let account = await User.findOne({ email: safeEmail });
  if (!account) {
    account = await Admin.findOne({ email: safeEmail });
  }

  // Generate 6-digit numeric OTP code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const tokenHash = crypto.createHash('sha256').update(resetCode).digest('hex');

  if (account) {
    account.resetPasswordToken = tokenHash;
    account.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await account.save();

    // Send verification email via Nodemailer
    await sendPasswordResetEmail(account.email, resetCode, account.name || 'User');
  }

  res.json({
    success: true,
    message: 'If an account exists with that email, a verification code has been sent to your email address.',
    // In dev / preview environments, code is also returned for instant testing
    ...(process.env.NODE_ENV !== 'production' || !process.env.SMTP_USER ? { resetCode } : {}),
  });
});

// @desc    Reset password using reset code
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, reset code, and new password are required',
    });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long',
    });
  }

  const safeEmail = sanitizeEmail(email);
  const tokenHash = crypto.createHash('sha256').update(String(resetCode).trim()).digest('hex');

  let account = await User.findOne({
    email: safeEmail,
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!account) {
    account = await Admin.findOne({
      email: safeEmail,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  if (!account) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired password reset code',
    });
  }

  account.password = String(newPassword);
  account.resetPasswordToken = undefined;
  account.resetPasswordExpires = undefined;
  await account.save();

  res.json({
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
});
