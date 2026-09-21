import { describe, it, expect } from 'vitest';
import booksReducer, {
  setFilter,
  resetFilters,
  clearCurrentBook,
  fetchBooks,
  fetchBookById,
} from '../booksSlice';

describe('booksSlice reducers', () => {
  const initialBooksState = {
    books: [],
    featuredBooks: [],
    bestsellers: [],
    currentBook: null,
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    loading: false,
    detailLoading: false,
    error: null,
    filters: {
      search: '',
      category: 'All',
      minPrice: '',
      maxPrice: '',
      sort: 'featured',
    },
  };

  it('should update filters with setFilter', () => {
    const nextState = booksReducer(
      initialBooksState,
      setFilter({ category: 'Fiction', minPrice: 100 })
    );
    expect(nextState.filters.category).toBe('Fiction');
    expect(nextState.filters.minPrice).toBe(100);
    expect(nextState.filters.sort).toBe('featured');
  });

  it('should reset filters with resetFilters', () => {
    const modifiedState = {
      ...initialBooksState,
      filters: { search: 'Gatsby', category: 'Fiction', minPrice: 200, maxPrice: 500, sort: 'rating' },
    };
    const nextState = booksReducer(modifiedState, resetFilters());
    expect(nextState.filters.search).toBe('');
    expect(nextState.filters.category).toBe('All');
    expect(nextState.filters.sort).toBe('featured');
  });

  it('should clear current book', () => {
    const stateWithBook = {
      ...initialBooksState,
      currentBook: { _id: '1', title: 'Sample' },
    };
    const nextState = booksReducer(stateWithBook, clearCurrentBook());
    expect(nextState.currentBook).toBeNull();
  });

  it('should handle fetchBooks.fulfilled', () => {
    const payload = {
      books: [{ _id: '1', title: 'Book 1' }],
      currentPage: 2,
      totalPages: 5,
      totalBooks: 50,
    };
    const nextState = booksReducer(initialBooksState, {
      type: fetchBooks.fulfilled.type,
      payload,
    });
    expect(nextState.loading).toBe(false);
    expect(nextState.books).toEqual(payload.books);
    expect(nextState.currentPage).toBe(2);
    expect(nextState.totalBooks).toBe(50);
  });

  it('should handle fetchBookById.fulfilled', () => {
    const book = { _id: '1', title: 'Clean Architecture' };
    const nextState = booksReducer(initialBooksState, {
      type: fetchBookById.fulfilled.type,
      payload: book,
    });
    expect(nextState.detailLoading).toBe(false);
    expect(nextState.currentBook).toEqual(book);
  });
});
