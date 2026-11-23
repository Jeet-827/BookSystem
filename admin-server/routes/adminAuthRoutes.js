import express from 'express';
import {
  adminLogin,
  adminRefreshToken,
  adminLogout,
  getAdminProfile,
  registerAdmin,
  changeAdminPassword,
  adminForgotPassword,
  adminResetPassword,
} from '../controllers/adminAuthController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/forgot-password', adminForgotPassword);
router.post('/reset-password', adminResetPassword);
router.post('/refresh', adminRefreshToken);
router.post('/logout', adminLogout);
router.post('/register-admin', registerAdmin);
router.get('/me', protectAdmin, getAdminProfile);
router.put('/change-password', protectAdmin, changeAdminPassword);
router.post('/change-password', protectAdmin, changeAdminPassword);

export default router;
