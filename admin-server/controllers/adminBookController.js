import Book from '../models/Book.js';
import { logAction } from '../utils/helpers.js';

export const sampleBooks = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description:
      'A masterpiece of American literature set in the Jazz Age, exploring themes of wealth, class, love, and the American Dream through narrator Nick Carraway and Jay Gatsby.',
    price: 299,
    originalPrice: 499,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    downloadUrl: 'https://www.gutenberg.org/ebooks/64317.epub.images',
    fileFormat: 'EPUB',
    fileSize: '4.2 MB',
    category: 'Fiction',
    rating: 4.6,
    reviewCount: 2341,
    stock: 25,
    pages: 180,
    publisher: 'Scribner',
    publishedYear: 1925,
    language: 'English',
    isFeatured: true,
    isBestseller: true,
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    description:
      'An easy and proven way to build good habits and break bad ones. Tiny changes, remarkable results — James Clear distills the most fundamental principles of habit formation.',
    price: 449,
    originalPrice: 699,
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '5.8 MB',
    category: 'Self-Help',
    rating: 4.9,
    reviewCount: 8921,
    stock: 50,
    pages: 320,
    publisher: 'Avery',
    publishedYear: 2018,
    language: 'English',
    isFeatured: true,
    isBestseller: true,
  },
  {
    title: 'Clean Code: Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    description:
      'Even bad code can function, but if code isn\'t clean, it can bring a development team to its knees. Master clean code design principles with this foundational guide.',
    price: 899,
    originalPrice: 1299,
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=400',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '8.4 MB',
    category: 'Technology',
    rating: 4.8,
    reviewCount: 5432,
    stock: 18,
    pages: 464,
    publisher: 'Prentice Hall',
    publishedYear: 2008,
    language: 'English',
    isFeatured: true,
    isBestseller: true,
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    description:
      'Groundbreaking narrative of humanity\'s creation and evolution that explores the ways in which biology and history have defined what it means to be human.',
    price: 549,
    originalPrice: 799,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '6.1 MB',
    category: 'History',
    rating: 4.7,
    reviewCount: 12043,
    stock: 35,
    pages: 443,
    publisher: 'Harper',
    publishedYear: 2011,
    language: 'English',
    isFeatured: true,
    isBestseller: true,
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    description:
      'A timeless fable about following your dream. Santiago, an Andalusian shepherd boy, travels from Spain to Egypt in search of treasure buried near the Pyramids.',
    price: 249,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    downloadUrl: 'https://www.gutenberg.org/files/11/11-pdf.pdf',
    fileFormat: 'PDF',
    fileSize: '2.1 MB',
    category: 'Fiction',
    rating: 4.5,
    reviewCount: 15890,
    stock: 40,
    pages: 208,
    publisher: 'HarperOne',
    publishedYear: 1988,
    language: 'English',
    isFeatured: false,
    isBestseller: true,
  },
  {
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    description:
      'Scrape away the bad features of JS to discover an elegant, lightweight, and highly expressive object-oriented language.',
    price: 599,
    originalPrice: 899,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '3.6 MB',
    category: 'Technology',
    rating: 4.6,
    reviewCount: 4210,
    stock: 19,
    pages: 176,
    publisher: "O'Reilly Media",
    publishedYear: 2008,
    language: 'English',
    isFeatured: true,
    isBestseller: true,
  },
];

export const getAdminBooks = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      stockStatus,
      isFeatured,
      isBestseller,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // 1. Search Query
    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ title: regex }, { author: regex }, { publisher: regex }, { isbn: regex }];
    }

    // 2. Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // 3. Stock filter
    if (stockStatus === 'out') {
      query.stock = { $lte: 0 };
    } else if (stockStatus === 'low') {
      query.stock = { $gt: 0, $lte: 5 };
    } else if (stockStatus === 'in') {
      query.stock = { $gt: 0 };
    }

    // 4. Boolean flags
    if (isFeatured !== undefined && isFeatured !== '') {
      query.isFeatured = isFeatured === 'true';
    }
    if (isBestseller !== undefined && isBestseller !== '') {
      query.isBestseller = isBestseller === 'true';
    }

    // 5. Price filter
    const isMinSet = minPrice !== undefined && minPrice !== '' && !isNaN(Number(minPrice));
    const isMaxSet = maxPrice !== undefined && maxPrice !== '' && !isNaN(Number(maxPrice));
    if (isMinSet || isMaxSet) {
      query.price = {};
      if (isMinSet) query.price.$gte = Number(minPrice);
      if (isMaxSet) query.price.$lte = Number(maxPrice);
    }

    // 6. Sorting
    let sortBy = { createdAt: -1 };
    switch (sort) {
      case 'price_asc':
        sortBy = { price: 1 };
        break;
      case 'price_desc':
        sortBy = { price: -1 };
        break;
      case 'stock_asc':
        sortBy = { stock: 1 };
        break;
      case 'stock_desc':
        sortBy = { stock: -1 };
        break;
      case 'title_asc':
        sortBy = { title: 1 };
        break;
      case 'rating_desc':
        sortBy = { rating: -1 };
        break;
      case 'oldest':
        sortBy = { createdAt: 1 };
        break;
      default:
        sortBy = { createdAt: -1 };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * perPage;

    const [total, books] = await Promise.all([
      Book.countDocuments(query),
      Book.find(query).sort(sortBy).skip(skip).limit(perPage),
    ]);

    res.json({
      success: true,
      books,
      currentPage: pageNum,
      totalPages: Math.ceil(total / perPage) || 1,
      totalBooks: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching books for admin',
    });
  }
};

// @desc    Get single book details by ID
// @route   GET /api/admin/books/:id
// @access  Private (Admin)
export const getAdminBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching book' });
  }
};

// @desc    Create a new book
// @route   POST /api/admin/books
// @access  Private (Admin)
export const createAdminBook = async (req, res) => {
  try {
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
      admin: req.admin,
      action: 'CREATE_BOOK',
      targetType: 'Book',
      targetId: book._id,
      details: { title: book.title, category: book.category, price: book.price },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating book',
    });
  }
};

// @desc    Update an existing book
// @route   PUT /api/admin/books/:id
// @access  Private (Admin)
export const updateAdminBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });

    await logAction({
      admin: req.admin,
      action: 'UPDATE_BOOK',
      targetType: 'Book',
      targetId: updated._id,
      details: { title: updated.title, changedFields: Object.keys(req.body) },
      req,
    });

    res.json({
      success: true,
      message: 'Book updated successfully',
      book: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating book',
    });
  }
};

// @desc    Delete a book
// @route   DELETE /api/admin/books/:id
// @access  Private (Admin)
export const deleteAdminBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    await Book.findByIdAndDelete(req.params.id);

    await logAction({
      admin: req.admin,
      action: 'DELETE_BOOK',
      targetType: 'Book',
      targetId: req.params.id,
      details: { title: book.title },
      req,
    });

    res.json({
      success: true,
      message: `Book "${book.title}" deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting book',
    });
  }
};

// @desc    Bulk delete books
// @route   POST /api/admin/books/bulk-delete
// @access  Private (Admin)
export const bulkDeleteBooks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of book IDs to delete',
      });
    }

    const result = await Book.deleteMany({ _id: { $in: ids } });

    await logAction({
      admin: req.admin,
      action: 'BULK_DELETE_BOOKS',
      targetType: 'Book',
      details: { deletedCount: result.deletedCount, ids },
      req,
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} books`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error executing bulk delete',
    });
  }
};

// @desc    Quick toggle featured status
// @route   PATCH /api/admin/books/:id/toggle-featured
// @access  Private (Admin)
export const toggleFeatured = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    book.isFeatured = !book.isFeatured;
    await book.save();

    await logAction({
      admin: req.admin,
      action: 'TOGGLE_FEATURED',
      targetType: 'Book',
      targetId: book._id,
      details: { title: book.title, isFeatured: book.isFeatured },
      req,
    });

    res.json({
      success: true,
      message: `Book is now ${book.isFeatured ? 'Featured' : 'Not Featured'}`,
      isFeatured: book.isFeatured,
      book,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling featured' });
  }
};

// @desc    Quick toggle bestseller status
// @route   PATCH /api/admin/books/:id/toggle-bestseller
// @access  Private (Admin)
export const toggleBestseller = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    book.isBestseller = !book.isBestseller;
    await book.save();

    await logAction({
      admin: req.admin,
      action: 'TOGGLE_BESTSELLER',
      targetType: 'Book',
      targetId: book._id,
      details: { title: book.title, isBestseller: book.isBestseller },
      req,
    });

    res.json({
      success: true,
      message: `Book is now ${book.isBestseller ? 'Bestseller' : 'Standard'}`,
      isBestseller: book.isBestseller,
      book,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling bestseller' });
  }
};

// @desc    Quick update stock count
// @route   PATCH /api/admin/books/:id/stock
// @access  Private (Admin)
export const updateStock = async (req, res) => {
  try {
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
      admin: req.admin,
      action: 'UPDATE_STOCK',
      targetType: 'Book',
      targetId: book._id,
      details: { title: book.title, newStock: Number(stock) },
      req,
    });

    res.json({
      success: true,
      message: `Stock updated to ${book.stock}`,
      book,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating stock' });
  }
};

// @desc    Seed / Reset Catalog in Database
// @route   POST /api/admin/books/seed
// @access  Private (Admin)
export const seedAdminBooks = async (req, res) => {
  try {
    await Book.deleteMany({});
    const books = await Book.insertMany(sampleBooks);

    await logAction({
      admin: req.admin,
      action: 'RESET_SEED_BOOKS',
      targetType: 'Book',
      details: { seededCount: books.length },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Database seeded with ${books.length} sample books`,
      count: books.length,
      books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error seeding database catalog',
    });
  }
};
