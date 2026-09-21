import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validateAuth.js';

const router = express.Router();


router.post('/register', validateRegister, register);

router.post('/login', validateLogin, login);

router.post('/refresh', refreshToken);

router.post('/logout', logout);

router.get('/me', protect, getMe);

export default router;
