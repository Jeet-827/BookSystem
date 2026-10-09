import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  requestRefund,
  downloadOrderItem,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.post('/:id/refund', requestRefund);
router.get('/:orderId/items/:itemId/download', downloadOrderItem);

export default router;
