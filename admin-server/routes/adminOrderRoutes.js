import express from 'express';
import {
  getAllOrders,
  updateOrderStatus,
  processRefund,
  getOrderStats,
} from '../controllers/adminOrderController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/stats', getOrderStats);
router.get('/', getAllOrders);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/refund', processRefund);

export default router;
