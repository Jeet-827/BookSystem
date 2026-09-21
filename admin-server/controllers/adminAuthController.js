import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setCookies,
  clearCookies,
  REFRESH_SECRET,
} from '../utils/generateTokens.js';
import { formatUser, sanitizeEmail, logAction } from '../utils/helpers.js';

// @desc    Admin login (requires role: 'admin')
// @route   POST /api/admin/auth/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const safeEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: safeEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have administrator permissions',
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    setCookies(res, accessToken, refreshToken);

    await logAction({
      admin: user,
      action: 'ADMIN_LOGIN',
      targetType: 'Auth',
      details: { email: user.email },
      req,
    });

    res.json({
      success: true,
      message: 'Admin authentication successful',
      accessToken,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during admin login',
    });
  }
};

// @desc    Admin refresh token
// @route   POST /api/admin/auth/refresh
// @access  Public (Requires adminRefreshToken cookie or body)
export const adminRefreshToken = async (req, res) => {
  try {
    const token = req.cookies?.adminRefreshToken || req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    const decoded = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.role !== 'admin') {
      clearCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Admin session invalid or expired',
      });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.role);

    setCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
      user: formatUser(user),
    });
  } catch (error) {
    clearCookies(res);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

// @desc    Admin Logout
// @route   POST /api/admin/auth/logout
// @access  Public
export const adminLogout = async (req, res) => {
  clearCookies(res);
  res.json({
    success: true,
    message: 'Admin logged out successfully',
  });
};

// @desc    Get current admin profile
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
export const getAdminProfile = async (req, res) => {
  res.json({
    success: true,
    user: formatUser(req.user),
  });
};

// @desc    Register a new admin (Protected or initial setup)
// @route   POST /api/admin/auth/register-admin
// @access  Public (if no admins exist) / Private (Admin only)
export const registerAdmin = async (req, res) => {
  try {
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    // If admins already exist and requester is not authenticated as admin, deny
    if (totalAdmins > 0) {
      // Check if authenticated
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only existing administrators can create new admin accounts',
        });
      }
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const safeEmail = sanitizeEmail(email);
    const existing = await User.findOne({ email: safeEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const admin = await User.create({
      name: String(name).trim(),
      email: safeEmail,
      password: String(password),
      role: 'admin',
    });

    const accessToken = generateAccessToken(admin._id, 'admin');
    const refreshToken = generateRefreshToken(admin._id, 'admin');
    setCookies(res, accessToken, refreshToken);

    if (req.user) {
      await logAction({
        admin: req.user,
        action: 'CREATE_ADMIN',
        targetType: 'User',
        targetId: admin._id,
        details: { newAdminEmail: admin.email },
        req,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Administrator account created successfully',
      accessToken,
      user: formatUser(admin),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating admin account',
    });
  }
};
