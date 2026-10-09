import jwt from 'jsonwebtoken';

export const ACCESS_SECRET = process.env.JWT_SECRET || 'bookmart_admin_secret_key_jwt_2024';
export const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'bookmart_admin_refresh_secret_key_2024';

export const generateAccessToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, REFRESH_SECRET, { expiresIn: '7d' });
};

export const setCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = isProd ? 'none' : 'lax';

  res.cookie('adminAccessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('adminRefreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = isProd ? 'none' : 'lax';
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite,
  };
  res.clearCookie('adminAccessToken', options);
  res.clearCookie('adminRefreshToken', options);
};
