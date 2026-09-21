import express from 'express';
import {
  adminLogin,
  adminRefreshToken,
  adminLogout,
  getAdminProfile,
  registerAdmin,
} from '../controllers/adminAuthController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/refresh', adminRefreshToken);
router.post('/logout', adminLogout);
router.post('/register-admin', registerAdmin);
router.get('/me', protectAdmin, getAdminProfile);

export default router;
