import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setCookies,
  clearCookies,
  REFRESH_SECRET,
} from '../utils/generateTokens.js';
import { formatUser, sanitizeEmail } from '../utils/helpers.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const safeEmail = sanitizeEmail(email);

    const existingUser = await User.findOne({ email: safeEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: safeEmail,
      password: String(password),
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'Account created',
      accessToken,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const safeEmail = sanitizeEmail(email);

    const user = await User.findOne({ email: safeEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    setCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      accessToken,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Verify refresh token
    const decoded = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      clearCookies(res);
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Issue fresh Access Token and rotated Refresh Token
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    setCookies(res, newAccessToken, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      user: formatUser(user),
    });
  } catch (error) {
    clearCookies(res);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// @desc    Logout user & destroy HTTP-Only cookies
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  clearCookies(res);
  res.json({ message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.json({ user: formatUser(req.user) });
};
