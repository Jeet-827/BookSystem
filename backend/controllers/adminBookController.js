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

  const { search, category, isFeatured, isBestseller, sortBy, sortOrder } = req.query;

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

  if (isFeatured !== undefined && isFeatured !== '') {
    query.isFeatured = isFeatured === 'true';
  }

  if (isBestseller !== undefined && isBestseller !== '') {
    query.isBestseller = isBestseller === 'true';
  }

  // H-08 fix: whitelist sortable fields to prevent MongoDB key injection
  const SORTABLE_FIELDS = ['title', 'author', 'price', 'rating', 'createdAt', 'publishedYear'];
  let sort = { createdAt: -1 };
  if (sortBy && SORTABLE_FIELDS.includes(sortBy)) {
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
    isbn,
    language,
    pages,
    publisher,
    publishedYear,
    isFeatured,
    isBestseller,
    rating,
  } = req.body;

  if (!title || !author || price === undefined || price === null || price === '') {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least title, author, and price to create a book.',
    });
  }

  const numericPrice = Number(price);
  const numericOriginalPrice =
    originalPrice !== undefined && originalPrice !== '' && !isNaN(Number(originalPrice))
      ? Number(originalPrice)
      : numericPrice;

  const defaultDesc = `${String(title).trim()} by ${String(author).trim()}. Premium digital eBook edition available for instant download on redkitindia.`;

  const book = await Book.create({
    title: String(title).trim(),
    author: String(author).trim(),
    description: description && String(description).trim() ? String(description).trim() : defaultDesc,
    price: numericPrice,
    originalPrice: numericOriginalPrice,
    image:
      image ||
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    downloadUrl:
      downloadUrl ||
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: fileFormat || 'PDF',
    fileSize: fileSize || '4.2 MB',
    category: category && String(category).trim() ? String(category).trim() : 'Fiction',
    isbn: isbn ? String(isbn).trim() : '',
    language: language || 'English',
    pages: pages ? Number(pages) : 250,
    publisher: publisher ? String(publisher).trim() : 'redkitindia Publishing',
    publishedYear: publishedYear ? Number(publishedYear) : new Date().getFullYear(),
    isFeatured: Boolean(isFeatured),
    isBestseller: Boolean(isBestseller),
    rating: rating ? Number(rating) : 4.5,
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

// @desc    Quick update stock count (no-op for digital books)
// @route   PATCH /api/admin/books/:id/stock
// @access  Private (Admin)
export const updateStock = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  res.json({
    success: true,
    message: 'Stock management is not required for digital instant downloads',
    book,
  });
});

// @desc    Seed / Reset Catalog in Database
// @route   POST /api/admin/books/seed
// @access  Private (Admin) — requires explicit destructive-action confirmation header
export const seedAdminBooks = asyncHandler(async (req, res) => {
  // H-09 fix: require an explicit confirmation header to prevent accidental wipes
  const confirmation = req.headers['x-confirm-destructive'];
  if (confirmation !== 'YES_DELETE_ALL_BOOKS') {
    return res.status(400).json({
      success: false,
      message:
        'Destructive operation requires confirmation header: ' +
        'x-confirm-destructive: YES_DELETE_ALL_BOOKS',
    });
  }

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
