import Order from '../models/Order.js';
import Book from '../models/Book.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BM-${timestamp}-${random}`;
};

// Generate fake transaction ID for payment simulation
const generateTransactionId = (method) => {
  const prefixes = { card: 'TXN', upi: 'UPI', netbanking: 'NB', wallet: 'WAL' };
  const prefix = prefixes[method] || 'TXN';
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
};

// Generate invoice number
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `INV-${year}-${seq}`;
};

// @desc    Create order with payment simulation (Checkout)
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, paymentDetails, couponCode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Order items cannot be empty',
    });
  }

  const validMethods = ['card', 'upi', 'netbanking', 'wallet'];
  const method = validMethods.includes(paymentMethod) ? paymentMethod : 'card';

  // Validate payment details based on method
  if (method === 'card') {
    const cardNumber = paymentDetails?.cardNumber?.replace(/\s/g, '') || '';
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return res.status(400).json({ success: false, message: 'Invalid card number' });
    }
  } else if (method === 'upi') {
    const upiId = paymentDetails?.upiId || '';
    if (!upiId.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid UPI ID format (must contain @)' });
    }
  }

  const orderItems = [];
  let subtotal = 0;

  // Validate books and stock server-side
  for (const item of items) {
    const bookId = item.bookId || item._id || item.book;
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Invalid item in checkout payload' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: `Book not found (ID: ${bookId})` });
    }

    if (book.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${book.title}". Available: ${book.stock}, Requested: ${qty}`,
      });
    }

    const itemTotal = book.price * qty;
    subtotal += itemTotal;

    orderItems.push({
      book: book._id,
      title: book.title,
      author: book.author,
      image: book.image || '',
      price: book.price,
      quantity: qty,
      digitalFileKey: book.downloadUrl || '',
      fileFormat: book.fileFormat || 'PDF',
      fileSize: book.fileSize || '4.2 MB',
    });
  }

  // Atomically decrement stock for each item
  for (const item of orderItems) {
    const updated = await Book.updateOne(
      { _id: item.book, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (updated.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: `Stock conflict for "${item.title}". Please try again.`,
      });
    }
  }

  // Calculate discount
  let discount = 0;
  if (couponCode === 'READMORE') {
    discount = Math.round(subtotal * 0.1); // 10% off
  } else if (couponCode === 'FIRST50') {
    discount = Math.round(subtotal * 0.5); // 50% off first order
  } else if (couponCode === 'BOOK20') {
    discount = Math.round(subtotal * 0.2); // 20% off
  }
  const totalAmount = Math.max(0, subtotal - discount);

  // Simulate payment processing (all succeed for demo)
  const transactionId = generateTransactionId(method);
  const orderNumber = generateOrderNumber();
  const invoiceNumber = generateInvoiceNumber();

  // Build payment details to store
  const storedPaymentDetails = {};
  if (method === 'card') {
    const cardNum = (paymentDetails?.cardNumber || '').replace(/\s/g, '');
    storedPaymentDetails.cardLast4 = cardNum.slice(-4);
    storedPaymentDetails.cardBrand = detectCardBrand(cardNum);
  } else if (method === 'upi') {
    storedPaymentDetails.upiId = paymentDetails?.upiId || '';
  } else if (method === 'netbanking') {
    storedPaymentDetails.bankName = paymentDetails?.bankName || 'HDFC Bank';
  } else if (method === 'wallet') {
    storedPaymentDetails.walletProvider = paymentDetails?.walletProvider || 'BookMart Wallet';
  }

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items: orderItems,
    paymentMethod: method,
    paymentDetails: storedPaymentDetails,
    transactionId,
    subtotal,
    discount,
    couponCode: couponCode || '',
    totalAmount,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    refundStatus: 'none',
    paidAt: new Date(),
    invoiceNumber,
  });

  res.status(201).json({
    success: true,
    message: 'Payment successful! Your ebooks are ready for download.',
    order,
  });
});

// Simple card brand detection
function detectCardBrand(number) {
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'Amex';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  if (/^35/.test(number)) return 'JCB';
  if (/^(?:2131|1800)/.test(number)) return 'JCB';
  return 'Card';
}

// @desc    Get logged-in user orders
// @route   GET /api/orders
// @access  Private
export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    count: orders.length,
    orders,
  });
});

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Not your order' });
  }

  res.json({ success: true, order });
});

// @desc    Request refund for an order
// @route   POST /api/orders/:id/refund
// @access  Private
export const requestRefund = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Access denied: Not your order' });
  }

  if (order.paymentStatus !== 'paid') {
    return res.status(400).json({ success: false, message: 'Only paid orders are eligible for refund' });
  }

  if (order.refundStatus !== 'none') {
    return res.status(400).json({ success: false, message: `Refund is already ${order.refundStatus}` });
  }

  // Check 24-hour refund window
  const hoursSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceOrder > 24) {
    return res.status(400).json({
      success: false,
      message: 'Refund window has expired. Refunds are only available within 24 hours of purchase.',
    });
  }

  order.refundStatus = 'requested';
  order.refundReason = reason ? String(reason).trim() : 'Customer requested refund';
  order.refundAmount = order.totalAmount;
  order.refundRequestedAt = new Date();
  await order.save();

  res.json({
    success: true,
    message: 'Refund request submitted successfully. Your refund will be processed within 24 hours.',
    order,
  });
});

// @desc    Authorized digital download link generation
// @route   GET /api/orders/:orderId/items/:itemId/download
// @access  Private
export const downloadOrderItem = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: You do not own this order' });
  }

  if (order.paymentStatus !== 'paid') {
    return res.status(400).json({ success: false, message: 'Order is not paid' });
  }

  if (order.refundStatus === 'approved') {
    return res.status(400).json({ success: false, message: 'Downloads unavailable for refunded orders' });
  }

  const item = order.items.id(itemId) || order.items.find((i) => String(i._id) === itemId || String(i.book) === itemId);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found in order' });
  }

  const downloadUrl = item.digitalFileKey || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  res.json({
    success: true,
    downloadUrl,
    title: item.title,
    fileFormat: item.fileFormat,
    fileSize: item.fileSize,
  });
});

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
  const query = {};

  if (status && status !== 'all') query.orderStatus = status;
  if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;

  if (search && typeof search === 'string' && search.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { orderNumber: { $regex: safeSearch, $options: 'i' } },
      { invoiceNumber: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * perPage;

  const [total, orders] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage),
  ]);

  res.json({
    success: true,
    orders,
    currentPage: pageNum,
    totalPages: Math.ceil(total / perPage) || 1,
    totalOrders: total,
  });
});

// @desc    Update order status (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;

  await order.save();

  res.json({ success: true, message: 'Order updated successfully', order });
});

// @desc    Process refund (Admin)
// @route   PUT /api/admin/orders/:id/refund
// @access  Private (Admin)
export const processRefund = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'
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

    // Restore stock for refunded items
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
    recentOrders,
    dailyRevenue,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'completed' }),
    Order.countDocuments({ orderStatus: 'cancelled' }),
    Order.countDocuments({ orderStatus: 'refunded' }),
    Order.countDocuments({ refundStatus: 'requested' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, avgOrderValue: { $avg: '$totalAmount' } } },
    ]),
    Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
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
      avgOrderValue: Math.round(revenueResult[0]?.avgOrderValue || 0),
      recentOrders,
      dailyRevenue,
    },
  });
});
