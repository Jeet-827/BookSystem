import jwt from 'jsonwebtoken';

export const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'bookmart_super_secret_jwt_key_2024';
export const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'bookmart_refresh_secret_key_2024_secure';

/**
 * Generates short-lived Access Token (15 minutes) for Admin API authorization
 * @param {string} id - User/Admin ID
 * @param {string} role - Role
 * @returns {string} Access Token
 */
export const generateAccessToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

/**
 * Generates long-lived Refresh Token (7 days) for session maintenance
 * @param {string} id - User/Admin ID
 * @param {string} role - Role
 * @returns {string} Refresh Token
 */
export const generateRefreshToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

/**
 * Sets secure HTTP-only cookies in response
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('adminAccessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('adminRefreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

/**
 * Clears token cookies on logout
 */
export const clearTokenCookies = (res) => {
  res.clearCookie('adminAccessToken');
  res.clearCookie('adminRefreshToken');
};
