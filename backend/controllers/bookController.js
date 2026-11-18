import Book from '../models/Book.js';
import { sampleBooks } from '../data/sampleBooks.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all public books with search, filters, pagination & sorting
// @route   GET /api/books
// @access  Public
export const getAllBooks = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
  const query = {};

  // Smart regex search across title, description, author, category
  if (search && typeof search === 'string' && search.trim() !== '') {
    const trimmed = search.trim();
    const safeRegex = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const words = trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const searchConditions = [
      { title: { $regex: safeRegex, $options: 'i' } },
      { description: { $regex: safeRegex, $options: 'i' } },
      { author: { $regex: safeRegex, $options: 'i' } },
      { category: { $regex: safeRegex, $options: 'i' } },
    ];

    if (words.length > 1) {
      const wordClauses = words.map((w) => ({
        $or: [
          { title: { $regex: w, $options: 'i' } },
          { description: { $regex: w, $options: 'i' } },
          { author: { $regex: w, $options: 'i' } },
          { category: { $regex: w, $options: 'i' } },
        ],
      }));
      searchConditions.push({ $and: wordClauses });
    }

    query.$or = searchConditions;
  }

  // Category Filter
  if (category && typeof category === 'string' && category !== 'All' && category.trim() !== '') {
    query.category = category.trim();
  }

  // Price Filter
  const isMinSet = minPrice !== undefined && minPrice !== '' && !isNaN(Number(minPrice));
  const isMaxSet = maxPrice !== undefined && maxPrice !== '' && !isNaN(Number(maxPrice));

  if (isMinSet || isMaxSet) {
    query.price = {};
    if (isMinSet) query.price.$gte = Number(minPrice);
    if (isMaxSet) query.price.$lte = Number(maxPrice);
  }

  // Sorting
  let sortBy = {};
  switch (sort) {
    case 'price_asc':
      sortBy = { price: 1 };
      break;
    case 'price_desc':
      sortBy = { price: -1 };
      break;
    case 'rating':
      sortBy = { rating: -1 };
      break;
    case 'newest':
      sortBy = { createdAt: -1 };
      break;
    default:
      sortBy = { isFeatured: -1, createdAt: -1 };
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(limit) || 12));
  const skip = (pageNum - 1) * perPage;

  const [total, books] = await Promise.all([
    Book.countDocuments(query),
    Book.find(query).select('-downloadUrl').sort(sortBy).skip(skip).limit(perPage).lean(),
  ]);

  res.json({
    success: true,
    books,
    currentPage: pageNum,
    totalPages: Math.ceil(total / perPage) || 1,
    totalBooks: total,
  });
});

// @desc    Get single book details
// @route   GET /api/books/:id
// @access  Public
export const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).select('-downloadUrl').lean();
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }
  res.json({ success: true, book });
});

// @desc    Get featured books
// @route   GET /api/books/featured
// @access  Public
export const getFeaturedBooks = asyncHandler(async (req, res) => {
  const books = await Book.find({ isFeatured: true }).select('-downloadUrl').limit(8).lean();
  res.json({ success: true, books });
});

// @desc    Get bestseller books
// @route   GET /api/books/bestsellers
// @access  Public
export const getBestsellers = asyncHandler(async (req, res) => {
  const books = await Book.find({ isBestseller: true }).select('-downloadUrl').limit(8).lean();
  res.json({ success: true, books });
});

// @desc    Smart instant preview search with regex across title, author, description, category
// @route   GET /api/books/preview?q=...
// @access  Public
export const searchBooksPreview = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.trim() === '') {
    return res.json({ success: true, count: 0, results: [] });
  }

  const trimmed = q.trim();
  const safeRegex = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const words = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const searchConditions = [
    { title: { $regex: safeRegex, $options: 'i' } },
    { description: { $regex: safeRegex, $options: 'i' } },
    { author: { $regex: safeRegex, $options: 'i' } },
    { category: { $regex: safeRegex, $options: 'i' } },
  ];

  if (words.length > 1) {
    const wordClauses = words.map((w) => ({
      $or: [
        { title: { $regex: w, $options: 'i' } },
        { description: { $regex: w, $options: 'i' } },
        { author: { $regex: w, $options: 'i' } },
        { category: { $regex: w, $options: 'i' } },
      ],
    }));
    searchConditions.push({ $and: wordClauses });
  }

  const results = await Book.find({ $or: searchConditions })
    .select('title author category price originalPrice image fileFormat fileSize description isFeatured isBestseller rating')
    .limit(8)
    .lean();

  res.json({
    success: true,
    count: results.length,
    results,
  });
});

