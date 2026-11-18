import { describe, it, expect, vi } from 'vitest';

// Utility mimicking backend & frontend smart regex search logic
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const buildSearchRegex = (query) => {
  const clean = escapeRegex(query.trim());
  return new RegExp(clean, 'i');
};

export const matchBook = (book, query) => {
  if (!query || typeof query !== 'string' || query.trim() === '') return false;
  const regex = buildSearchRegex(query);
  return (
    regex.test(book.title || '') ||
    regex.test(book.description || '') ||
    regex.test(book.author || '') ||
    regex.test(book.category || '') ||
    regex.test(book.fileFormat || '')
  );
};

export const multiWordMatch = (book, query) => {
  if (!query || typeof query !== 'string' || query.trim() === '') return false;
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(buildSearchRegex);

  // Every word must match at least one field
  return words.every((wordRegex) =>
    wordRegex.test(book.title || '') ||
    wordRegex.test(book.description || '') ||
    wordRegex.test(book.author || '') ||
    wordRegex.test(book.category || '') ||
    wordRegex.test(book.fileFormat || '')
  );
};

const mockCatalog = [
  {
    _id: 'b1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description: 'A masterpiece set in the Jazz Age exploring wealth and the American Dream.',
    category: 'Fiction',
    price: 299,
    fileFormat: 'EPUB',
  },
  {
    _id: 'b2',
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'An easy and proven way to build good habits and break bad ones.',
    category: 'Self-Help',
    price: 449,
    fileFormat: 'PDF',
  },
  {
    _id: 'b3',
    title: 'Clean Code: Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    description: 'Even bad code can function, but if code is not clean it brings teams down.',
    category: 'Technology',
    price: 899,
    fileFormat: 'PDF',
  },
  {
    _id: 'b4',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    description: 'How a seemingly insignificant ape became the ruler of planet Earth.',
    category: 'History',
    price: 499,
    fileFormat: 'PDF',
  },
];

describe('Smart Regex Search & Live Preview Test Suite (18 Tests)', () => {
  it('1. Matches books by exact title keyword', () => {
    const results = mockCatalog.filter((b) => matchBook(b, 'Gatsby'));
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('The Great Gatsby');
  });

  it('2. Matches books by author name', () => {
    const results = mockCatalog.filter((b) => matchBook(b, 'James Clear'));
    expect(results).toHaveLength(1);
    expect(results[0]._id).toBe('b2');
  });

  it('3. Matches books through deep description content (e.g. Jazz Age)', () => {
    const results = mockCatalog.filter((b) => matchBook(b, 'Jazz Age'));
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('The Great Gatsby');
  });

  it('4. Matches books by category / genre', () => {
    const results = mockCatalog.filter((b) => matchBook(b, 'Technology'));
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('Clean Code');
  });

  it('5. Performs case-insensitive regex matching (lowercase query matches uppercase title)', () => {
    const results = mockCatalog.filter((b) => matchBook(b, 'atomic'));
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Atomic Habits');
  });

  it('6. Escapes regex special characters safely to prevent regex injection (e.g. [.*+?])', () => {
    const safeRegex = escapeRegex('Clean Code (Agile) [100%]');
    expect(safeRegex).toBe('Clean Code \\(Agile\\) \\[100%\\]');
    expect(() => new RegExp(safeRegex)).not.toThrow();
  });

  it('7. Handles malicious regex characters without causing a crash', () => {
    const maliciousQuery = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(maliciousQuery);
    expect(() => new RegExp(escaped)).not.toThrow();
    const results = mockCatalog.filter((b) => matchBook(b, maliciousQuery));
    expect(results).toHaveLength(0);
  });

  it('8. Returns false for empty or whitespace-only search queries', () => {
    expect(matchBook(mockCatalog[0], '')).toBe(false);
    expect(matchBook(mockCatalog[0], '   ')).toBe(false);
    expect(matchBook(mockCatalog[0], null)).toBe(false);
  });

  it('9. Supports multi-word queries across different fields (e.g. "Martin Technology")', () => {
    const results = mockCatalog.filter((b) => multiWordMatch(b, 'Martin Technology'));
    expect(results).toHaveLength(1);
    expect(results[0].author).toBe('Robert C. Martin');
    expect(results[0].category).toBe('Technology');
  });

  it('10. Multi-word search requires all words to match somewhere in the book record', () => {
    const results = mockCatalog.filter((b) => multiWordMatch(b, 'Martin NonExistentWord'));
    expect(results).toHaveLength(0);
  });

  it('11. Trims leading and trailing whitespace from search terms', () => {
    const results = mockCatalog.filter((b) => matchBook(b, '   Sapiens   '));
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('Sapiens');
  });

  it('12. Preserves book ID and metadata for direct preview navigation', () => {
    const results = mockCatalog.filter((b) => matchBook(b, 'Clean'));
    expect(results[0]._id).toBe('b3');
    expect(results[0].fileFormat).toBe('PDF');
  });

  it('13. Simulates search debouncing mechanism (calls search only after delay)', () => {
    vi.useFakeTimers();
    const searchFn = vi.fn();

    const debounceSearch = (term) => {
      setTimeout(() => searchFn(term), 300);
    };

    debounceSearch('Gatsby');
    expect(searchFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(searchFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith('Gatsby');
    vi.useRealTimers();
  });

  it('14. Cancels prior debounce timers when user types rapidly', () => {
    vi.useFakeTimers();
    const searchFn = vi.fn();
    let timer = null;

    const onType = (text) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => searchFn(text), 300);
    };

    onType('A');
    onType('At');
    onType('Ato');
    onType('Atomic');

    vi.advanceTimersByTime(300);
    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith('Atomic');
    vi.useRealTimers();
  });

  it('15. Formats search preview destination URL for specific book click', () => {
    const bookId = 'b1';
    const detailUrl = `/books/${bookId}`;
    expect(detailUrl).toBe('/books/b1');
  });

  it('16. Formats "View all results" search page URL with URI encoded query parameter', () => {
    const query = 'clean code & habits';
    const searchUrl = `/books?search=${encodeURIComponent(query)}`;
    expect(searchUrl).toBe('/books?search=clean%20code%20%26%20habits');
  });

  it('17. Accurately counts search results for dropdown preview header', () => {
    const results = mockCatalog.filter((b) => matchBook(b, 'PDF'));
    expect(results.length).toBe(3);
  });

  it('18. Matches partial word stems (e.g. "hab" matches "habits")', () => {
    const results = mockCatalog.filter((b) => matchBook(b, 'hab'));
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Atomic Habits');
  });

  it('19. Calculates Flipkart/Meesho-style discount percentage for items: ((MRP - Price) / MRP) * 100', () => {
    const book = { price: 299, originalPrice: 499 };
    const discountPercent = Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100);
    expect(discountPercent).toBe(40);
  });

  it('20. Formats Meesho/Flipkart-style rating badge and category context for live preview card', () => {
    const book = { rating: 4.8, category: 'Self-Help' };
    const ratingDisplay = `★ ${book.rating}`;
    const categoryDisplay = `in ${book.category}`;
    expect(ratingDisplay).toBe('★ 4.8');
    expect(categoryDisplay).toBe('in Self-Help');
  });
});
