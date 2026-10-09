import express from 'express';
import { getDashboardStats, getActivityLogs } from '../controllers/adminDashboardController.js';
import { protect, adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getDashboardStats);
router.get('/activity', getActivityLogs);

export default router;
