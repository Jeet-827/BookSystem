import express from 'express';
import {
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateUserRole,
  deleteAdminUser,
} from '../controllers/adminUserController.js';
import { protect, adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/', getAdminUsers);
router.get('/:id', getAdminUserById);
router.post('/', createAdminUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteAdminUser);

export default router;
