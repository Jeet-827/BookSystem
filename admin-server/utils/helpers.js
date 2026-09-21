import AdminLog from '../models/AdminLog.js';

export const sanitizeEmail = (email) => {
  return String(email || '').trim().toLowerCase();
};

export const formatUser = (user) => {
  if (!user) return null;
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const logAction = async ({ admin, action, targetType = 'System', targetId = null, details = {}, req = null }) => {
  try {
    if (!admin) return;
    await AdminLog.create({
      adminId: admin._id || admin.id,
      adminName: admin.name || 'Admin',
      adminEmail: admin.email || 'admin@bookmart.com',
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      details,
      ipAddress: req?.ip || req?.socket?.remoteAddress || '127.0.0.1',
    });
  } catch (err) {
    console.error('Failed to write admin log:', err.message);
  }
};
