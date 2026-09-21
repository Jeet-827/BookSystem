import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks, setFilter, resetFilters } from '../store/slices/booksSlice';
import BookCard from '../components/BookCard';
import MoonLoader from '../components/MoonLoader';
import { SlidersHorizontal, RotateCcw, X, Filter } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Fiction',
  'Self-Help',
  'Technology',
  'History',
  'Science',
  'Biography',
  'Non-Fiction',
];

// Memoized Filter Sidebar Component
const FilterSection = memo(
  ({
    filters,
    isDebouncing,
    onCategoryChange,
    onPriceChange,
    onReset,
  }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} />
          <h3 className="font-extrabold text-base text-gray-900 font-display">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
        >
          Clear All
        </button>
      </div>

      {/* Category List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Category / Genre
        </h4>
        <ul className="space-y-2">
          {CATEGORIES.map((cat) => (
            <li key={cat}>
              <label className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-700 hover:text-black cursor-pointer select-none">
                <input
                  type="radio"
                  name="categoryFilter"
                  checked={filters.category === cat}
                  onChange={() => onCategoryChange(cat)}
                  className="accent-black w-4 h-4 cursor-pointer"
                />
                <span className={filters.category === cat ? 'font-bold text-black' : ''}>
                  {cat === 'All' ? 'All Genres' : cat}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Filter with Debounced Input */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Price Range (₹)
          </h4>
          {isDebouncing && (
            <span className="text-[10px] font-bold text-amber-600 animate-pulse">
              Updating...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onPriceChange('minPrice', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded text-xs focus:outline-none focus:border-black"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onPriceChange('maxPrice', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded text-xs focus:outline-none focus:border-black"
          />
        </div>
      </div>
    </div>
  )
);

FilterSection.displayName = 'FilterSection';

const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const dispatch = useDispatch();
  const { books, totalBooks, currentPage, loading, filters } = useSelector(
    (state) => state.books
  );

  // Sync URL query params
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');

    const updates = {};
    if (urlCategory && urlCategory !== filters.category) {
      updates.category = urlCategory;
    }
    if (urlSearch && urlSearch !== filters.search) {
      updates.search = urlSearch;
    }
    if (Object.keys(updates).length > 0) {
      dispatch(setFilter(updates));
    }
  }, [searchParams, dispatch, filters.category, filters.search]);

  // Debounced fetch on filter/search changes (400ms delay)
  useEffect(() => {
    setIsDebouncing(true);

    const timer = setTimeout(() => {
      const queryParams = {
        sort: filters.sort || 'featured',
        page: currentPage || 1,
      };

      if (filters.search && filters.search.trim()) {
        queryParams.search = filters.search.trim();
      }
      if (filters.category && filters.category !== 'All') {
        queryParams.category = filters.category;
      }
      if (filters.minPrice !== '' && !isNaN(filters.minPrice)) {
        queryParams.minPrice = filters.minPrice;
      }
      if (filters.maxPrice !== '' && !isNaN(filters.maxPrice)) {
        queryParams.maxPrice = filters.maxPrice;
      }

      dispatch(fetchBooks(queryParams)).finally(() => {
        setIsDebouncing(false);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [dispatch, filters, currentPage]);

  const handleCategoryChange = useCallback(
    (cat) => {
      dispatch(setFilter({ category: cat }));
      const newParams = new URLSearchParams(searchParams);
      if (cat === 'All') {
        newParams.delete('category');
      } else {
        newParams.set('category', cat);
      }
      setSearchParams(newParams);
      setMobileFilterOpen(false);
    },
    [dispatch, searchParams, setSearchParams]
  );

  const handleSortChange = useCallback(
    (e) => {
      dispatch(setFilter({ sort: e.target.value }));
    },
    [dispatch]
  );

  const handlePriceChange = useCallback(
    (field, val) => {
      dispatch(setFilter({ [field]: val }));
    },
    [dispatch]
  );

  const handleReset = useCallback(() => {
    dispatch(resetFilters());
    setSearchParams({});
    setMobileFilterOpen(false);
  }, [dispatch, setSearchParams]);

  const categoryTitle = useMemo(
    () => (filters.category !== 'All' ? filters.category : 'All Books'),
    [filters.category]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[calc(100vh-140px)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-24">
          <FilterSection
            filters={filters}
            isDebouncing={isDebouncing}
            onCategoryChange={handleCategoryChange}
            onPriceChange={handlePriceChange}
            onReset={handleReset}
          />
        </aside>

        {/* Mobile Filter Drawer Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileFilterOpen(false)}
            />
            <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col z-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                <h3 className="font-extrabold text-lg">Filters</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              <FilterSection
                filters={filters}
                isDebouncing={isDebouncing}
                onCategoryChange={handleCategoryChange}
                onPriceChange={handlePriceChange}
                onReset={handleReset}
              />
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="mt-8 w-full bg-black text-white py-2.5 rounded-lg font-bold text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Main Catalog Area */}
        <section className="lg:col-span-9 space-y-4 min-h-[620px] flex flex-col">
          {/* Top Bar with Sort & Mobile Filter Toggle */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 font-display">
                {categoryTitle}
              </h2>
              <p className="text-xs text-gray-500">
                Showing {books.length} of {totalBooks} items
                {filters.search && ` for "${filters.search}"`}
              </p>
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold"
              >
                <Filter size={14} />
                <span>Filters</span>
              </button>

              {/* Sort Select */}
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                  Sort By:
                </span>
                <select
                  value={filters.sort}
                  onChange={handleSortChange}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-black"
                >
                  <option value="featured">Featured First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>
          </div>

          {/* Book Cards Grid with MoonLoader during fetch / debounce */}
          {loading || isDebouncing ? (
            <div className="bg-white rounded-xl border border-gray-200 py-24 flex flex-col items-center justify-center flex-1 min-h-[480px]">
              <MoonLoader size={48} color="#000000" text="Filtering books..." />
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-4 flex-1 flex flex-col items-center justify-center min-h-[480px]">
              <div className="text-4xl">📚</div>
              <h3 className="text-lg font-extrabold text-gray-900">No books match your criteria</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try adjusting your search keywords, category selection, or clearing price filters.
              </p>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800"
              >
                <RotateCcw size={14} />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 min-h-[520px] content-start">
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Books;
