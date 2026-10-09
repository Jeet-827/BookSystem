import express from 'express';
import { getSystemHealth } from '../controllers/adminSystemController.js';
import { protect, adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/health', getSystemHealth);

export default router;
