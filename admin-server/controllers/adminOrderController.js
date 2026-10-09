import Order from '../models/Order.js';
import Book from '../models/Book.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const query = {};

  if (status && status !== 'all') query.orderStatus = status;

  if (search && typeof search === 'string' && search.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { orderNumber: { $regex: safeSearch, $options: 'i' } },
      { transactionId: { $regex: safeSearch, $options: 'i' } },
      { invoiceNumber: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, orders] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  res.json({
    success: true,
    orders,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    total,
  });
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['processing', 'completed', 'cancelled', 'refunded'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid order status' });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus: status },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    order,
  });
});

// @desc    Process refund request (Approve/Reject)
// @route   PUT /api/admin/orders/:id/refund
// @access  Private (Admin)
export const processRefund = asyncHandler(async (req, res) => {
  const { action, adminNote } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.refundStatus !== 'requested') {
    return res.status(400).json({ success: false, message: 'No pending refund request for this order' });
  }

  if (action === 'approve') {
    order.refundStatus = 'approved';
    order.paymentStatus = 'refunded';
    order.orderStatus = 'refunded';
    order.refundProcessedAt = new Date();

    for (const item of order.items) {
      await Book.updateOne({ _id: item.book }, { $inc: { stock: item.quantity } });
    }
  } else if (action === 'reject') {
    order.refundStatus = 'rejected';
    order.refundProcessedAt = new Date();
  } else {
    return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject"' });
  }

  await order.save();

  res.json({
    success: true,
    message: `Refund ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    order,
  });
});

// @desc    Get order stats for dashboard (Admin)
// @route   GET /api/admin/orders/stats
// @access  Private (Admin)
export const getOrderStats = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    completedOrders,
    cancelledOrders,
    refundedOrders,
    pendingRefunds,
    revenueResult,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'completed' }),
    Order.countDocuments({ orderStatus: 'cancelled' }),
    Order.countDocuments({ orderStatus: 'refunded' }),
    Order.countDocuments({ refundStatus: 'requested' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders,
      completedOrders,
      cancelledOrders,
      refundedOrders,
      pendingRefunds,
      totalRevenue: revenueResult[0]?.totalRevenue || 0,
    },
  });
});
