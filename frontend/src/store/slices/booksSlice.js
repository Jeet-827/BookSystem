import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async Thunk: Fetch all books with query params
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/books', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch books');
    }
  }
);
export const fetchBookById = createAsyncThunk(
  'books/fetchBookById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/books/${id}`);
      return response.data.book;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch book detail');
    }
  }
);

export const fetchFeaturedBooks = createAsyncThunk(
  'books/fetchFeaturedBooks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/books/featured');
      return response.data.books;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch featured books');
    }
  }
);

// Async Thunk: Fetch bestsellers
export const fetchBestsellers = createAsyncThunk(
  'books/fetchBestsellers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/books/bestsellers');
      return response.data.books;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch bestsellers');
    }
  }
);

const initialState = {
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

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        search: '',
        category: 'All',
        minPrice: '',
        maxPrice: '',
        sort: 'featured',
      };
    },
    clearCurrentBook: (state) => {
      state.currentBook = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Books
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload.books;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalBooks = action.payload.totalBooks;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Book By ID
      .addCase(fetchBookById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
        state.currentBook = null;
      })
      .addCase(fetchBookById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentBook = action.payload;
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // Featured Books
      .addCase(fetchFeaturedBooks.fulfilled, (state, action) => {
        state.featuredBooks = action.payload;
      })

      // Bestsellers
      .addCase(fetchBestsellers.fulfilled, (state, action) => {
        state.bestsellers = action.payload;
      });
  },
});

export const { setFilter, resetFilters, clearCurrentBook } = booksSlice.actions;
export default booksSlice.reducer;
