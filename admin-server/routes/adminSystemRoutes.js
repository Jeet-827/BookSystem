import express from 'express';
import { getSystemHealth } from '../controllers/adminSystemController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/health', getSystemHealth);

export default router;
