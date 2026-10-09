import express from 'express';
import {
  getAllOrders,
  updateOrderStatus,
  processRefund,
  getOrderStats,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getOrderStats);
router.get('/', getAllOrders);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/refund', processRefund);

export default router;
