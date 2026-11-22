import 'dotenv/config';
import jwt from 'jsonwebtoken';

// Fail-fast: refuse to run in production without proper secrets
const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production. Refusing to start.');
}
if (isProd && !process.env.JWT_REFRESH_SECRET) {
  throw new Error('FATAL: JWT_REFRESH_SECRET environment variable is required in production. Refusing to start.');
}

// In development/test, use a deterministic-but-weak fallback so dev starts without extra config.
// The fallback is intentionally NOT a secret value used in production.
const ACCESS_SECRET = process.env.JWT_SECRET || 'dev_only_access_secret_change_in_production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_only_refresh_secret_change_in_production';

/**
 * Generates short-lived Access Token (15 minutes) for API authorization
 * @param {string} id - User ID
 * @returns {string} Access Token
 */
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, ACCESS_SECRET, { expiresIn: '15m' });
};

/**
 * Generates long-lived Refresh Token (7 days) for session maintenance
 * @param {string} id - User ID
 * @returns {string} Refresh Token
 */
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Sets secure HTTP-only cookies in the response
 * @param {Object} res - Express Response object
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setCookies = (res, accessToken, refreshToken) => {
  // Always use sameSite: 'none' and secure: true for cross-origin production deployments
  // (e.g. frontend on redkitindia.com/Vercel and backend on onrender.com)
  const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const sameSite = isProd ? 'none' : 'lax';
  const secure = isProd;

  // Access Token Cookie (15 mins)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  // Refresh Token Cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Admin Refresh Token Cookie for cross-route compatibility
  res.cookie('adminRefreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

/**
 * Clears token cookies from browser on logout
 * @param {Object} res - Express Response object
 */
export const clearCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const sameSite = isProd ? 'none' : 'lax';
  const secure = isProd;
  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
  res.clearCookie('adminAccessToken', options);
  res.clearCookie('adminRefreshToken', options);
};

export { ACCESS_SECRET, REFRESH_SECRET };
