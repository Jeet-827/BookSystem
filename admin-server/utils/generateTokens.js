import jwt from 'jsonwebtoken';

const getSecret = (key, fallback) => {
  const val = process.env[key];
  if (!val) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`CRITICAL: Mandatory environment variable ${key} is not set in production!`);
    }
    return fallback;
  }
  return val;
};

export const ACCESS_SECRET = getSecret('JWT_SECRET', 'dev_admin_jwt_secret_change_me_in_env');
export const REFRESH_SECRET = getSecret('JWT_REFRESH_SECRET', 'dev_admin_refresh_secret_change_me_in_env');

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
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('adminRefreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: '/',
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
    path: '/',
  };
  res.clearCookie('adminAccessToken', options);
  res.clearCookie('adminRefreshToken', options);
};
