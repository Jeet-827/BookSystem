import Book from '../models/Book.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import AdminLog from '../models/AdminLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get comprehensive dashboard metrics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalBooks,
    totalUsers,
    totalAdmins,
    outOfStockBooks,
    featuredBooksCount,
    bestsellerBooksCount,
    categoryStats,
    priceStats,
    recentBooks,
    recentUsers,
    totalOrders,
    orderRevenue,
    pendingRefundsCount,
  ] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Book.countDocuments({ stock: { $lte: 0 } }),
    Book.countDocuments({ isFeatured: true }),
    Book.countDocuments({ isBestseller: true }),
    Book.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Book.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' },
          totalInventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
        },
      },
    ]),
    Book.find().sort({ createdAt: -1 }).limit(5).select('title author price category stock image createdAt'),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ refundStatus: 'requested' }),
  ]);

  const overview = {
    books: {
      total: totalBooks,
      outOfStock: outOfStockBooks,
      inStock: Math.max(0, totalBooks - outOfStockBooks),
      featured: featuredBooksCount,
      bestsellers: bestsellerBooksCount,
    },
    orders: {
      total: totalOrders,
      revenue: orderRevenue[0]?.total || 0,
      pendingRefunds: pendingRefundsCount,
    },
    users: {
      total: totalUsers,
      admins: totalAdmins,
      customers: Math.max(0, totalUsers - totalAdmins),
    },
    financials: {
      totalRevenue: orderRevenue[0]?.total || 0,
      totalInventoryValue: priceStats[0]?.totalInventoryValue || 0,
      averageBookPrice: Math.round(priceStats[0]?.avgPrice || 0),
      minPrice: priceStats[0]?.minPrice || 0,
      maxPrice: priceStats[0]?.maxPrice || 0,
    },
    categories: categoryStats.map((c) => ({
      category: c._id || 'Uncategorized',
      count: c.count,
      avgPrice: Math.round(c.avgPrice || 0),
      totalStock: c.totalStock || 0,
    })),
    recentBooks,
    recentUsers,
  };

  res.json({
    success: true,
    stats: overview,
  });
});

// @desc    Get administrative activity audit logs
// @route   GET /api/admin/dashboard/activity
// @access  Private (Admin)
export const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, targetType } = req.query;
  const query = {};
  if (targetType) {
    query.targetType = targetType;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * perPage;

  const [total, logs] = await Promise.all([
    AdminLog.countDocuments(query),
    AdminLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage),
  ]);

  res.json({
    success: true,
    logs,
    currentPage: pageNum,
    totalPages: Math.ceil(total / perPage) || 1,
    totalLogs: total,
  });
});
