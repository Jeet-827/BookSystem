import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import { ACCESS_SECRET } from '../utils/generateTokens.js';

export const protectAdmin = async (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies.adminAccessToken) {
    token = req.cookies.adminAccessToken;
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Admin authentication token required',
    });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    let admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      admin = await User.findById(decoded.id).select('-password');
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Requires administrator privileges',
      });
    }

    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin account is deactivated',
      });
    }

    req.user = admin;
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token expired or invalid',
      isTokenExpired: error.name === 'TokenExpiredError',
    });
  }
};
