import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}

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
  const isProd = process.env.NODE_ENV === 'production';

  // Access Token Cookie (15 mins)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  // Refresh Token Cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clears token cookies from browser on logout
 * @param {Object} res - Express Response object
 */
export const clearCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

export { ACCESS_SECRET, REFRESH_SECRET };
