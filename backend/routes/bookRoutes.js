import express from 'express';
import {
  getAllBooks,
  getBookById,
  getFeaturedBooks,
  getBestsellers,
} from '../controllers/bookController.js';

const router = express.Router();

router.get('/', getAllBooks);
router.get('/featured', getFeaturedBooks);
router.get('/bestsellers', getBestsellers);
router.get('/:id', getBookById);

export default router;
