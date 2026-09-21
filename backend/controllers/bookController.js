import Book from '../models/Book.js';

export const sampleBooks = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description:
      'A masterpiece of American literature set in the Jazz Age, exploring themes of wealth, class, love, and the American Dream through narrator Nick Carraway and Jay Gatsby.',
    price: 299,
    originalPrice: 499,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
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
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600',
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
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=600',
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
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
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
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://www.gutenberg.org/files/11/11-pdf.pdf',
    fileFormat: 'PDF',
    fileSize: '3.2 MB',
    category: 'Fiction',
    rating: 4.5,
    reviewCount: 9876,
    stock: 42,
    pages: 208,
    publisher: 'HarperOne',
    publishedYear: 1988,
    language: 'English',
    isFeatured: false,
    isBestseller: true,
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    description:
      'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. A Pulitzer Prize-winning classic of modern literature.',
    price: 349,
    originalPrice: 499,
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://www.gutenberg.org/ebooks/1342.epub.images',
    fileFormat: 'EPUB',
    fileSize: '2.8 MB',
    category: 'Fiction',
    rating: 4.8,
    reviewCount: 7654,
    stock: 20,
    pages: 281,
    publisher: 'J. B. Lippincott',
    publishedYear: 1960,
    language: 'English',
    isFeatured: true,
    isBestseller: false,
  },
  {
    title: 'The Power of Now',
    author: 'Eckhart Tolle',
    description:
      'A guide to spiritual enlightenment and presence. Realize that peace and freedom from anxiety are found only by surrendering to the present moment.',
    price: 399,
    originalPrice: 599,
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '3.9 MB',
    category: 'Self-Help',
    rating: 4.4,
    reviewCount: 4321,
    stock: 30,
    pages: 236,
    publisher: 'New World Library',
    publishedYear: 1997,
    language: 'English',
    isFeatured: false,
    isBestseller: false,
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    description:
      'Set on the desert planet Arrakis, Dune is the epic saga of Paul Atreides, heir to a noble dynasty fighting for control over the universe\'s most valuable substance: spice.',
    price: 499,
    originalPrice: 699,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '7.5 MB',
    category: 'Fiction',
    rating: 4.7,
    reviewCount: 15234,
    stock: 15,
    pages: 896,
    publisher: 'Chilton Books',
    publishedYear: 1965,
    language: 'English',
    isFeatured: true,
    isBestseller: true,
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    description:
      'Stephen Hawking explores profound cosmological questions about the creation of the cosmos, black holes, time travel, and unified physical theories.',
    price: 399,
    originalPrice: 599,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '4.8 MB',
    category: 'Science',
    rating: 4.6,
    reviewCount: 6789,
    stock: 22,
    pages: 212,
    publisher: 'Bantam',
    publishedYear: 1988,
    language: 'English',
    isFeatured: true,
    isBestseller: false,
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    description:
      'How today\'s entrepreneurs build successful enterprises using continuous innovation, validated learning, and rapid prototyping methodologies.',
    price: 649,
    originalPrice: 899,
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '5.1 MB',
    category: 'Non-Fiction',
    rating: 4.5,
    reviewCount: 3456,
    stock: 28,
    pages: 336,
    publisher: 'Crown Business',
    publishedYear: 2011,
    language: 'English',
    isFeatured: false,
    isBestseller: false,
  },
  {
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    description:
      'The exclusive, unvarnished biography of Apple co-founder Steve Jobs, built on hundreds of candid interviews with Jobs, family, colleagues, and rivals.',
    price: 749,
    originalPrice: 999,
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '9.2 MB',
    category: 'Biography',
    rating: 4.7,
    reviewCount: 8123,
    stock: 12,
    pages: 656,
    publisher: 'Simon & Schuster',
    publishedYear: 2011,
    language: 'English',
    isFeatured: true,
    isBestseller: true,
  },
  {
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    description:
      'Scrape away the bad features of JS to discover an elegant, lightweight, and highly expressive object-oriented language.',
    price: 599,
    originalPrice: 899,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileFormat: 'PDF',
    fileSize: '3.6 MB',
    category: 'Technology',
    rating: 4.6,
    reviewCount: 4210,
    stock: 19,
    pages: 176,
    publisher: 'O\'Reilly Media',
    publishedYear: 2008,
    language: 'English',
    isFeatured: true,
    isBestseller: true,
  },
];

export const getAllBooks = async (req, res) => {
  try {
    // If database is empty, auto-populate
    const count = await Book.countDocuments();
    if (count === 0) {
      await Book.insertMany(sampleBooks);
    }

    const { search, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const query = {};

    // 1. Search Query
    if (search && typeof search === 'string' && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { author: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // 2. Category Query
    if (category && typeof category === 'string' && category !== 'All' && category.trim() !== '') {
      query.category = category.trim();
    }

    // 3. Price Filter (Strict non-empty check)
    const hasMin = minPrice !== undefined && minPrice !== '' && !isNaN(Number(minPrice));
    const hasMax = maxPrice !== undefined && maxPrice !== '' && !isNaN(Number(maxPrice));

    if (hasMin || hasMax) {
      query.price = {};
      if (hasMin) query.price.$gte = Number(minPrice);
      if (hasMax) query.price.$lte = Number(maxPrice);
    }

    // 4. Sorting
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { isFeatured: -1, createdAt: -1 };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 12);
    const skip = (pageNum - 1) * limitNum;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query).sort(sortOption).skip(skip).limit(limitNum);

    res.json({
      books,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      totalBooks: total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books' });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ book });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book' });
  }
};

export const getFeaturedBooks = async (req, res) => {
  try {
    const count = await Book.countDocuments();
    if (count === 0) {
      await Book.insertMany(sampleBooks);
    }
    const books = await Book.find({ isFeatured: true }).limit(8);
    res.json({ books });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching featured books' });
  }
};

export const getBestsellers = async (req, res) => {
  try {
    const count = await Book.countDocuments();
    if (count === 0) {
      await Book.insertMany(sampleBooks);
    }
    const books = await Book.find({ isBestseller: true }).limit(8);
    res.json({ books });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bestsellers' });
  }
};

export const seedBooks = async (req, res) => {
  try {
    await Book.deleteMany({});
    const books = await Book.insertMany(sampleBooks);
    res.status(201).json({
      message: `Seeded ${books.length} books`,
      count: books.length,
      books,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during seeding' });
  }
};
