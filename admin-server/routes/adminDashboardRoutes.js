import express from 'express';
import { getDashboardStats, getActivityLogs } from '../controllers/adminDashboardController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/stats', getDashboardStats);
router.get('/activity', getActivityLogs);

export default router;
