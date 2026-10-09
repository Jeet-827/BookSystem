import os from 'os';
import { getDbStatus } from '../config/db.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get system diagnostic and database metrics
// @route   GET /api/admin/system/health
// @access  Private (Admin)
export const getSystemHealth = asyncHandler(async (req, res) => {
  const dbStatus = getDbStatus ? getDbStatus() : { status: 'connected' };
  const [bookCount, userCount, logCount] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments(),
    AdminLog.countDocuments(),
  ]);

  const systemInfo = {
    server: {
      status: 'online',
      uptimeSeconds: Math.floor(process.uptime()),
      uptimeFormatted: `${Math.floor(process.uptime() / 60)} mins ${Math.floor(process.uptime() % 60)} secs`,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memoryUsage: {
        rssMb: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
        heapTotalMb: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
        heapUsedMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      },
      systemMemory: {
        freeGb: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
        totalGb: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
      },
    },
    database: {
      ...dbStatus,
      collections: {
        books: bookCount,
        users: userCount,
        adminLogs: logCount,
      },
    },
    timestamp: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: systemInfo,
  });
});
