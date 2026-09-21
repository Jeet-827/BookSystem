import express from 'express';
import {
  getAdminBooks,
  getAdminBookById,
  createAdminBook,
  updateAdminBook,
  deleteAdminBook,
  bulkDeleteBooks,
  toggleFeatured,
  toggleBestseller,
  updateStock,
  seedAdminBooks,
} from '../controllers/adminBookController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAdmin);

router.get('/', getAdminBooks);
router.get('/:id', getAdminBookById);
router.post('/', createAdminBook);
router.put('/:id', updateAdminBook);
router.delete('/:id', deleteAdminBook);
router.post('/bulk-delete', bulkDeleteBooks);
router.patch('/:id/toggle-featured', toggleFeatured);
router.patch('/:id/toggle-bestseller', toggleBestseller);
router.patch('/:id/stock', updateStock);
router.post('/seed', seedAdminBooks);

export default router;
