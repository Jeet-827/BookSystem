import express from 'express';
import {
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateUserRole,
  deleteAdminUser,
} from '../controllers/adminUserController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/', getAdminUsers);
router.get('/:id', getAdminUserById);
router.post('/', createAdminUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteAdminUser);

export default router;
