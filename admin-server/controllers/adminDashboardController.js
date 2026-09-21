import Book from '../models/Book.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';

// @desc    Get comprehensive dashboard metrics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
export const getDashboardStats = async (req, res) => {
  try {
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
    ]);

    const overview = {
      books: {
        total: totalBooks,
        outOfStock: outOfStockBooks,
        inStock: Math.max(0, totalBooks - outOfStockBooks),
        featured: featuredBooksCount,
        bestsellers: bestsellerBooksCount,
      },
      users: {
        total: totalUsers,
        admins: totalAdmins,
        customers: Math.max(0, totalUsers - totalAdmins),
      },
      financials: {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard stats',
    });
  }
};

// @desc    Get administrative activity audit logs
// @route   GET /api/admin/dashboard/activity
// @access  Private (Admin)
export const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, targetType } = req.query;
    const query = {};
    if (targetType) {
      query.targetType = targetType;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AdminLog.countDocuments(query),
      AdminLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    res.json({
      success: true,
      logs,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      totalLogs: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching activity logs',
    });
  }
};
