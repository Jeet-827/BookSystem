import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ACCESS_TOKEN_SECRET } from '../utils/generateTokens.js';

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
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Requires admin privileges',
      });
    }

    req.user = user;
    req.admin = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token expired or invalid',
      isTokenExpired: error.name === 'TokenExpiredError',
    });
  }
};
