import AdminLog from '../models/AdminLog.js';

export const sanitizeEmail = (email) => {
  return String(email || '').trim().toLowerCase();
};

export const formatUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id || user.id,
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const getDiscount = (originalPrice, price) => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const logAction = async ({ admin, user, action, details = '', req = null }) => {
  try {
    const actor = admin || user || req?.user;
    if (!actor) return;
    await AdminLog.create({
      adminId: actor._id || actor.id,
      adminEmail: actor.email || 'admin@bookmart.com',
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      ipAddress: req?.ip || req?.socket?.remoteAddress || '127.0.0.1',
    });
  } catch (err) {
    console.error('Failed to write admin log:', err.message);
  }
};
