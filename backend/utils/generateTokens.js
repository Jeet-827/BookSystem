import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'bookmart_access_secret_key_2024';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'bookmart_refresh_secret_key_2024_secure';

/**
 * Generates short-lived Access Token (15 minutes) for API authorization
 * @param {string} id - User ID
 * @returns {string} Access Token
 */
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

/**
 * Generates long-lived Refresh Token (7 days) for session maintenance
 * @param {string} id - User ID
 * @returns {string} Refresh Token
 */
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

/**
 * Sets secure HTTP-only cookies in the response (LinkedIn-style multi-token security)
 * @param {Object} res - Express Response object
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Access Token Cookie (15 mins)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  // Refresh Token Cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clears token cookies from browser on logout
 * @param {Object} res - Express Response object
 */
export const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

export { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET };
