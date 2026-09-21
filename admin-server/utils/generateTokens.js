import jwt from 'jsonwebtoken';

export const ACCESS_SECRET = process.env.JWT_SECRET;
export const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}


export const generateAccessToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (id, role = 'admin') => {
  return jwt.sign({ id, role }, REFRESH_SECRET, { expiresIn: '7d' });
};


export const setCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('adminAccessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('adminRefreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};


export const clearCookies = (res) => {
  res.clearCookie('adminAccessToken');
  res.clearCookie('adminRefreshToken');
};
