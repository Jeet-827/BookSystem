import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setCookies,
  clearCookies,
  REFRESH_SECRET,
} from '../utils/generateTokens.js';
import { formatUser, sanitizeEmail, logAction } from '../utils/helpers.js';

// @desc    Admin login (authenticates against Admin collection with adminSchema)
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
    let admin = await Admin.findOne({ email: safeEmail });

    // Fallback migration: check if admin exists in legacy User model
    if (!admin) {
      const legacyUser = await User.findOne({ email: safeEmail, role: 'admin' });
      if (legacyUser) {
        const isMatch = await legacyUser.comparePassword(String(password));
        if (isMatch) {
          admin = await Admin.create({
            name: legacyUser.name,
            email: legacyUser.email,
            password: String(password),
            role: 'admin',
          });
        }
      }
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials',
      });
    }

    const isMatch = await admin.comparePassword(String(password));
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials',
      });
    }

    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Administrator account is deactivated. Contact system support.',
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const accessToken = generateAccessToken(admin._id, admin.role || 'admin');
    const refreshToken = generateRefreshToken(admin._id, admin.role || 'admin');

    setCookies(res, accessToken, refreshToken);

    await logAction({
      admin,
      action: 'ADMIN_LOGIN',
      targetType: 'Auth',
      details: { email: admin.email },
      req,
    });

    res.json({
      success: true,
      message: 'Admin authentication successful',
      accessToken,
      refreshToken,
      user: formatUser(admin),
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
    let admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      admin = await User.findById(decoded.id).select('-password');
    }

    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      clearCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Admin session invalid or expired',
      });
    }

    const newAccessToken = generateAccessToken(admin._id, admin.role || 'admin');
    const newRefreshToken = generateRefreshToken(admin._id, admin.role || 'admin');

    setCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: formatUser(admin),
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
    user: formatUser(req.admin || req.user),
  });
};

// @desc    Change admin password
// @route   PUT /api/admin/auth/change-password
// @access  Private (Admin)
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.admin?._id || req.user?._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    let admin = await Admin.findById(adminId);
    if (!admin) {
      admin = await User.findById(adminId);
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    const isMatch = await admin.comparePassword(String(currentPassword));
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    admin.password = String(newPassword);
    await admin.save();

    await logAction({
      admin,
      action: 'CHANGE_PASSWORD',
      targetType: 'Admin',
      targetId: admin._id,
      details: { email: admin.email },
      req,
    });

    res.json({
      success: true,
      message: 'Admin password updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing admin password',
    });
  }
};

// @desc    Register a new admin (Protected or initial setup)
// @route   POST /api/admin/auth/register-admin
// @access  Public (if no admins exist) / Private (Admin only)
export const registerAdmin = async (req, res) => {
  try {
    const totalAdmins = await Admin.countDocuments();

    // If admins already exist and requester is not authenticated as admin, deny
    if (totalAdmins > 0) {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
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
    const existing = await Admin.findOne({ email: safeEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Administrator with this email already exists',
      });
    }

    const admin = await Admin.create({
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
        targetType: 'Admin',
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
