import Book from '../models/Book.js';
import { sampleBooks } from '../data/sampleBooks.js';
import { logAction } from '../utils/helpers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import cache from '../utils/cache.js';

// @desc    Get all books with advanced filtering, search, sorting & pagination
// @route   GET /api/admin/books
// @access  Private (Admin)
export const getAdminBooks = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const { search, category, stockStatus, isFeatured, isBestseller, sortBy, sortOrder } = req.query;

  const query = {};

  if (search && String(search).trim()) {
    const escapedSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { title: { $regex: escapedSearch, $options: 'i' } },
      { author: { $regex: escapedSearch, $options: 'i' } },
      { isbn: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (stockStatus) {
    if (stockStatus === 'in-stock') query.stock = { $gt: 5 };
    else if (stockStatus === 'low-stock') query.stock = { $gt: 0, $lte: 5 };
    else if (stockStatus === 'out-of-stock') query.stock = 0;
  }

  if (isFeatured !== undefined && isFeatured !== '') {
    query.isFeatured = isFeatured === 'true';
  }

  if (isBestseller !== undefined && isBestseller !== '') {
    query.isBestseller = isBestseller === 'true';
  }

  let sort = { createdAt: -1 };
  if (sortBy) {
    const order = sortOrder === 'asc' ? 1 : -1;
    sort = { [sortBy]: order };
  }

  const [books, total] = await Promise.all([
    Book.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Book.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: books.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    books,
  });
});

// @desc    Get single book by ID
// @route   GET /api/admin/books/:id
// @access  Private (Admin)
export const getAdminBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }
  res.json({ success: true, book });
});

// @desc    Create a new book
// @route   POST /api/admin/books
// @access  Private (Admin)
export const createAdminBook = asyncHandler(async (req, res) => {
  const {
    title,
    author,
    description,
    price,
    originalPrice,
    image,
    downloadUrl,
    fileFormat,
    fileSize,
    category,
    stock,
    isbn,
    language,
    pages,
    publisher,
    publishedYear,
    isFeatured,
    isBestseller,
    rating,
  } = req.body;

  if (!title || !author || !description || price === undefined || originalPrice === undefined || !category) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: title, author, description, price, originalPrice, category',
    });
  }

  const book = await Book.create({
    title: String(title).trim(),
    author: String(author).trim(),
    description: String(description).trim(),
    price: Number(price),
    originalPrice: Number(originalPrice),
    image: image || '',
    downloadUrl: downloadUrl || '',
    fileFormat: fileFormat || 'PDF',
    fileSize: fileSize || '3.5 MB',
    category: String(category).trim(),
    stock: stock !== undefined ? Number(stock) : 10,
    isbn: isbn ? String(isbn).trim() : '',
    language: language || 'English',
    pages: pages ? Number(pages) : undefined,
    publisher: publisher ? String(publisher).trim() : undefined,
    publishedYear: publishedYear ? Number(publishedYear) : undefined,
    isFeatured: Boolean(isFeatured),
    isBestseller: Boolean(isBestseller),
    rating: rating ? Number(rating) : 4.0,
  });

  await logAction({
    admin: req.user,
    action: 'CREATE_BOOK',
    details: { title: book.title, category: book.category, price: book.price },
    req,
  });

  cache.clear();

  res.status(201).json({
    success: true,
    message: 'Book created successfully',
    book,
  });
});

// @desc    Update an existing book (whitelisted fields)
// @route   PUT /api/admin/books/:id
// @access  Private (Admin)
export const updateAdminBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  const allowedUpdates = [
    'title',
    'author',
    'description',
    'price',
    'originalPrice',
    'image',
    'downloadUrl',
    'fileFormat',
    'fileSize',
    'category',
    'stock',
    'isbn',
    'language',
    'pages',
    'publisher',
    'publishedYear',
    'isFeatured',
    'isBestseller',
    'rating',
  ];

  const updateFields = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateFields[field] = req.body[field];
    }
  });

  const updated = await Book.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  await logAction({
    admin: req.user,
    action: 'UPDATE_BOOK',
    details: { title: updated.title, changedFields: Object.keys(updateFields) },
    req,
  });

  cache.clear();

  res.json({
    success: true,
    message: 'Book updated successfully',
    book: updated,
  });
});

// @desc    Delete a book
// @route   DELETE /api/admin/books/:id
// @access  Private (Admin)
export const deleteAdminBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  await Book.findByIdAndDelete(req.params.id);

  await logAction({
    admin: req.user,
    action: 'DELETE_BOOK',
    details: { title: book.title },
    req,
  });

  cache.clear();

  res.json({
    success: true,
    message: `Book "${book.title}" deleted successfully`,
  });
});

// @desc    Bulk delete books
// @route   POST /api/admin/books/bulk-delete
// @access  Private (Admin)
export const bulkDeleteBooks = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of book IDs to delete',
    });
  }

  const result = await Book.deleteMany({ _id: { $in: ids } });

  await logAction({
    admin: req.user,
    action: 'BULK_DELETE_BOOKS',
    details: { deletedCount: result.deletedCount, ids },
    req,
  });

  cache.clear();

  res.json({
    success: true,
    message: `Successfully deleted ${result.deletedCount} books`,
    deletedCount: result.deletedCount,
  });
});

// @desc    Quick toggle featured status
// @route   PATCH /api/admin/books/:id/toggle-featured
// @access  Private (Admin)
export const toggleFeatured = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  book.isFeatured = !book.isFeatured;
  await book.save();

  await logAction({
    admin: req.user,
    action: 'TOGGLE_FEATURED',
    details: { title: book.title, isFeatured: book.isFeatured },
    req,
  });

  cache.clear();

  res.json({
    success: true,
    message: `Book is now ${book.isFeatured ? 'Featured' : 'Not Featured'}`,
    isFeatured: book.isFeatured,
    book,
  });
});

// @desc    Quick toggle bestseller status
// @route   PATCH /api/admin/books/:id/toggle-bestseller
// @access  Private (Admin)
export const toggleBestseller = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  book.isBestseller = !book.isBestseller;
  await book.save();

  await logAction({
    admin: req.user,
    action: 'TOGGLE_BESTSELLER',
    details: { title: book.title, isBestseller: book.isBestseller },
    req,
  });

  cache.clear();

  res.json({
    success: true,
    message: `Book is now ${book.isBestseller ? 'Bestseller' : 'Standard'}`,
    isBestseller: book.isBestseller,
    book,
  });
});

// @desc    Quick update stock count
// @route   PATCH /api/admin/books/:id/stock
// @access  Private (Admin)
export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid non-negative stock count' });
  }

  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { $set: { stock: Number(stock) } },
    { new: true }
  );

  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  await logAction({
    admin: req.user,
    action: 'UPDATE_STOCK',
    details: { title: book.title, newStock: Number(stock) },
    req,
  });

  cache.clear();

  res.json({
    success: true,
    message: `Stock updated to ${book.stock}`,
    book,
  });
});

// @desc    Seed / Reset Catalog in Database
// @route   POST /api/admin/books/seed
// @access  Private (Admin)
export const seedAdminBooks = asyncHandler(async (req, res) => {
  await Book.deleteMany({});
  const books = await Book.insertMany(sampleBooks);

  await logAction({
    admin: req.user,
    action: 'RESET_SEED_BOOKS',
    details: { seededCount: books.length },
    req,
  });

  cache.clear();

  res.status(201).json({
    success: true,
    message: `Database seeded with ${books.length} sample books`,
    count: books.length,
    books,
  });
});
