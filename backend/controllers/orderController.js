import crypto from 'crypto';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BM-${timestamp}-${random}`;
};

// Generate invoice number
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `INV-${year}-${seq}`;
};

// Verify Razorpay HMAC signature
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('Razorpay key secret is not configured');
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
};

// COUPON_CODES — server-authoritative discount table.
// Replace with a Coupon DB model when ready.
const COUPON_TABLE = {
  READMORE: { type: 'percent', value: 10 },
  FIRST50:  { type: 'percent', value: 50 },
  BOOK20:   { type: 'percent', value: 20 },
};

const applyCouponDiscount = (couponCode, subtotal) => {
  if (!couponCode) return 0;
  const coupon = COUPON_TABLE[couponCode.trim().toUpperCase()];
  if (!coupon) return 0;
  if (coupon.type === 'percent') {
    return Math.round(subtotal * (coupon.value / 100));
  }
  return Math.min(coupon.value, subtotal);
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a Razorpay order on the server (step 1 of payment)
// @route   POST /api/orders/razorpay/create-order
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { items, couponCode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(503).json({
      success: false,
      message: 'Payment gateway is not configured on this server',
    });
  }

  // Batch-fetch books (H-01 fix)
  const bookIds = [...new Set(items.map((i) => i.bookId || i._id || i.book).filter(Boolean))];
  const books = await Book.find({ _id: { $in: bookIds } }).lean();
  const bookMap = new Map(books.map((b) => [String(b._id), b]));

  let subtotal = 0;
  for (const item of items) {
    const bookId = String(item.bookId || item._id || item.book || '');
    const book = bookMap.get(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: `Book not found (ID: ${bookId})` });
    }
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    subtotal += book.price * qty;
  }

  const discount = applyCouponDiscount(couponCode, subtotal);
  const totalAmount = Math.max(1, subtotal - discount); // Razorpay minimum 1 INR

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const receipt = `rcpt_${Date.now()}`;

  let rzpData;
  try {
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({
        amount: Math.round(totalAmount * 100), // paise
        currency: 'INR',
        receipt,
      }),
    });
    rzpData = await rzpRes.json();

    if (!rzpRes.ok || !rzpData.id) {
      logger.error(`Razorpay order creation failed: ${JSON.stringify(rzpData)}`);
      return res.status(502).json({ success: false, message: 'Failed to create payment order. Please try again.' });
    }
  } catch (err) {
    logger.error(`Razorpay API error: ${err.message}`);
    return res.status(502).json({ success: false, message: 'Payment gateway is temporarily unavailable.' });
  }

  // Return only the Razorpay order ID and public key — never the secret
  return res.json({
    success: true,
    orderId: rzpData.id,
    amount: rzpData.amount,
    currency: rzpData.currency,
    keyId, // public key — safe to send to browser
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify payment and create order (step 2 — called after Razorpay success callback)
// @route   POST /api/orders
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const createOrder = asyncHandler(async (req, res) => {
  const { items, paymentDetails, couponCode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order items cannot be empty' });
  }

  // C-08 fix: Require and verify Razorpay signature before creating any order
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentDetails || {};

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification details are required',
    });
  }

  let signatureValid = false;
  try {
    signatureValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  } catch (err) {
    logger.error(`Signature verification error: ${err.message}`);
    return res.status(503).json({ success: false, message: 'Payment verification unavailable' });
  }

  if (!signatureValid) {
    logger.warn(
      `Invalid Razorpay signature for payment ${razorpay_payment_id} from user ${req.user._id}`
    );
    return res.status(400).json({ success: false, message: 'Payment verification failed. Please contact support.' });
  }

  // Batch-fetch books server-side (H-01 fix — never trust client prices)
  const bookIds = [...new Set(items.map((i) => i.bookId || i._id || i.book).filter(Boolean))];
  const books = await Book.find({ _id: { $in: bookIds } }).lean();
  const bookMap = new Map(books.map((b) => [String(b._id), b]));

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const bookId = String(item.bookId || item._id || item.book || '');
    const book = bookMap.get(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: `Book not found (ID: ${bookId})` });
    }

    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    subtotal += book.price * qty;

    orderItems.push({
      book: book._id,
      title: book.title,
      author: book.author,
      image: book.image || '',
      price: book.price,   // server-authoritative price
      quantity: qty,
      // C-05 fix: store the actual key; never expose a public dummy fallback URL
      digitalFileKey: book.downloadUrl || '',
      fileFormat: book.fileFormat || 'PDF',
      fileSize: book.fileSize || 'N/A',
    });
  }

  // Server-side coupon calculation
  const discount = applyCouponDiscount(couponCode, subtotal);
  const totalAmount = Math.max(0, subtotal - discount);

  const orderNumber = generateOrderNumber();
  const invoiceNumber = generateInvoiceNumber();

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items: orderItems,
    paymentMethod: 'razorpay',
    paymentDetails: {
      gateway: 'Razorpay',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      // Store only a hash of the signature — never the raw sig
      razorpaySignature: crypto.createHash('sha256').update(razorpay_signature).digest('hex'),
    },
    transactionId: razorpay_payment_id,
    subtotal,
    discount,
    couponCode: couponCode ? couponCode.trim().toUpperCase() : '',
    totalAmount,
    paymentStatus: 'paid',   // confirmed by verified signature above
    orderStatus: 'completed',
    refundStatus: 'none',
    paidAt: new Date(),
    invoiceNumber,
  });

  // Return order but strip internal file keys from response
  const safeOrder = order.toObject();
  safeOrder.items = safeOrder.items.map(({ digitalFileKey, ...rest }) => rest);

  res.status(201).json({
    success: true,
    message: 'Payment verified. Your eBooks are ready for download.',
    order: safeOrder,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get logged-in user orders
// @route   GET /api/orders
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select('-items.digitalFileKey') // never expose storage keys in list
    .lean();

  res.json({ success: true, count: orders.length, orders });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).select('-items.digitalFileKey').lean();

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Not your order' });
  }

  res.json({ success: true, order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Request refund for an order
// @route   POST /api/orders/:id/refund
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
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

  const hoursSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceOrder > 24) {
    return res.status(400).json({
      success: false,
      message: 'Refund window has expired. Refunds are only available within 24 hours of purchase.',
    });
  }

  order.refundStatus = 'requested';
  order.refundReason = reason ? String(reason).trim().slice(0, 500) : 'Customer requested refund';
  order.refundAmount = order.totalAmount;
  order.refundRequestedAt = new Date();
  await order.save();

  res.json({
    success: true,
    message: 'Refund request submitted successfully. Your refund will be processed within 24 hours.',
    order: { ...order.toObject(), items: order.items.map(({ digitalFileKey, ...rest }) => rest) },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Generate authorized download URL for a purchased item
// @route   GET /api/orders/:orderId/items/:itemId/download
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
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
    return res.status(403).json({ success: false, message: 'Downloads unavailable for refunded orders' });
  }

  const item =
    order.items.id(itemId) ||
    order.items.find((i) => String(i._id) === itemId || String(i.book) === itemId);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found in order' });
  }

  // C-05 fix: no dummy PDF fallback. If no key is stored, return a 503.
  if (!item.digitalFileKey) {
    return res.status(503).json({
      success: false,
      message: 'Download file is not yet available for this item. Please contact support.',
    });
  }

  // Return the stored key (Google Drive file ID or CDN URL).
  // The client should use the /api/drive/download/:fileId proxy for Drive files,
  // which now requires authentication (C-09 fix).
  res.json({
    success: true,
    downloadUrl: item.digitalFileKey,
    title: item.title,
    fileFormat: item.fileFormat,
    fileSize: item.fileSize,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
  const query = {};

  if (status === 'paid') {
    query.paymentStatus = 'paid';
  } else if (status && status !== 'all') {
    query.orderStatus = status;
  }

  if (paymentStatus && paymentStatus !== 'all') {
    query.paymentStatus = paymentStatus;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { orderNumber: { $regex: safeSearch, $options: 'i' } },
      { invoiceNumber: { $regex: safeSearch, $options: 'i' } },
      { transactionId: { $regex: safeSearch, $options: 'i' } },
      { 'paymentDetails.razorpayPaymentId': { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * perPage;

  const [total, orders, collectedMetrics] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .select('-items.digitalFileKey')
      .lean(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalCollectedAmount: { $sum: '$totalAmount' }, paidCount: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    orders,
    currentPage: pageNum,
    page: pageNum,
    totalPages: Math.ceil(total / perPage) || 1,
    pages: Math.ceil(total / perPage) || 1,
    totalOrders: total,
    total,
    metrics: {
      totalCollectedAmount: collectedMetrics[0]?.totalCollectedAmount || 0,
      paidCount: collectedMetrics[0]?.paidCount || 0,
      totalOrders: total,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update order status (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const validOrderStatuses = ['processing', 'completed', 'cancelled', 'refunded'];
  const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

  if (orderStatus && validOrderStatuses.includes(orderStatus)) order.orderStatus = orderStatus;
  if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) order.paymentStatus = paymentStatus;

  await order.save();

  res.json({ success: true, message: 'Order updated successfully', order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Process refund (Admin)
// @route   PUT /api/admin/orders/:id/refund
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const processRefund = asyncHandler(async (req, res) => {
  const { action } = req.body;
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
    // NOTE: Actual provider refund (Razorpay Refunds API) must be triggered here
    // when live payment integration is completed.
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get order stats for dashboard (Admin)
// @route   GET /api/admin/orders/stats
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
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
      .select('-items.digitalFileKey')
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
