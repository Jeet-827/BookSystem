import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { selectCartCount } from '../store/slices/cartSlice';
import { setFilter } from '../store/slices/booksSlice';
import api from '../api/axios';
import {
  Search,
  ShoppingBag,
  User,
  LogOut,
  Compass,
  Menu,
  X,
  Package,
  ArrowRight,
  Loader2,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';

const EMPTY_ARRAY = [];

const TRENDING_SEARCHES = [
  'Atomic Habits',
  'Clean Code',
  'The Great Gatsby',
  'Sapiens',
  'Technology',
  'Fiction',
  'Self-Help',
];

const Navbar = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPreview, setSearchPreview] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartCount);
  const orders = useSelector((state) => state.orders?.orders || EMPTY_ARRAY);

  // Debounced regex preview search across title, author, description, category
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchPreview([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await api.get(`/books/preview?q=${encodeURIComponent(trimmed)}`);
        if (res.data?.success) {
          setSearchPreview(res.data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Search preview error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle outside click and escape key to close preview dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target) &&
        (!mobileSearchRef.current || !mobileSearchRef.current.contains(e.target))
      ) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const term = searchTerm.trim();
      if (term) {
        dispatch(setFilter({ search: term }));
        navigate(`/books?search=${encodeURIComponent(term)}`);
        setShowDropdown(false);
        setMobileMenuOpen(false);
      }
    },
    [searchTerm, dispatch, navigate]
  );

  const handleSelectBook = useCallback(
    (bookId) => {
      setShowDropdown(false);
      setSearchTerm('');
      navigate(`/books/${bookId}`);
    },
    [navigate]
  );

  const handleTrendingClick = useCallback(
    (query) => {
      setSearchTerm(query);
      dispatch(setFilter({ search: query }));
      navigate(`/books?search=${encodeURIComponent(query)}`);
      setShowDropdown(false);
      setMobileMenuOpen(false);
    },
    [dispatch, navigate]
  );

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
    navigate('/');
    setMobileMenuOpen(false);
  }, [dispatch, navigate]);

  return (
    <header className="sticky top-0 z-50 bg-[#0f1115] text-white border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-3 md:gap-6">
          {/* Brand Logo - redkitindia */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <img
              src="/logo.png"
              alt="redkitindia logo"
              className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 transition-transform group-hover:scale-105"
            />
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-white font-display">
                redkitindia
              </span>
              <span className="text-[10px] uppercase font-bold bg-white text-black px-1.5 py-0.5 rounded tracking-wider">
                Plus
              </span>
            </div>
          </Link>

          {/* Flipkart/Meesho-Style Smart Search Bar (Desktop) */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl relative items-center">
            <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
              <Search size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search for Books, Authors, Genres, Topics..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#181b22] border border-gray-700 hover:border-gray-600 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all shadow-inner"
              />
              {isSearching ? (
                <Loader2 size={16} className="absolute right-3.5 text-gray-400 animate-spin" />
              ) : searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchPreview([]);
                  }}
                  className="absolute right-3.5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              ) : null}
            </form>

            {/* Flipkart / Meesho Rich Search Dropdown Panel */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#161922] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl animate-fadeIn">
                {/* 1. If typing and results available */}
                {searchTerm.trim().length >= 2 ? (
                  <div>
                    {/* Header bar */}
                    <div className="px-4 py-2.5 bg-[#12141a] border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1.5 font-bold text-gray-300">
                        <Sparkles size={14} className="text-amber-400" />
                        Showing items for &quot;{searchTerm}&quot;
                      </span>
                      <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full font-semibold">
                        {searchPreview.length} {searchPreview.length === 1 ? 'item' : 'items'} found
                      </span>
                    </div>

                    {/* Product List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-800/60">
                      {searchPreview.length > 0 ? (
                        searchPreview.map((book) => {
                          const discountPercent =
                            book.originalPrice && book.originalPrice > book.price
                              ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
                              : 0;

                          return (
                            <div
                              key={book._id}
                              onClick={() => handleSelectBook(book._id)}
                              className="p-3.5 flex items-center gap-3.5 hover:bg-white/5 cursor-pointer transition-all group"
                            >
                              {/* Book Cover Thumbnail */}
                              <div className="relative w-12 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-900 border border-gray-800 shadow group-hover:scale-105 transition-transform">
                                <img
                                  src={book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=150'}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Book Details (Flipkart / Meesho format) */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                                  {book.title}
                                </h4>
                                <p className="text-xs text-gray-400 truncate mt-0.5">by {book.author}</p>

                                <div className="flex items-center gap-2 mt-1.5">
                                  {/* Rating Star Badge (Flipkart Green Pill) */}
                                  <div className="inline-flex items-center gap-1 bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    <span>{book.rating || '4.8'}</span>
                                    <Star size={10} className="fill-emerald-400" />
                                  </div>

                                  {/* Category Tag */}
                                  <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded font-medium truncate">
                                    in {book.category}
                                  </span>

                                  {/* Instant Digital Download badge */}
                                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                                    <Zap size={10} />
                                    {book.fileFormat || 'PDF'}
                                  </span>
                                </div>
                              </div>

                              {/* Price Column (Flipkart Style: Selling Price, MRP, % off) */}
                              <div className="text-right flex-shrink-0 pl-2">
                                <div className="text-base font-extrabold text-white">₹{book.price}</div>
                                {discountPercent > 0 && (
                                  <div className="flex items-center gap-1 justify-end text-[11px] mt-0.5">
                                    <span className="text-gray-500 line-through">₹{book.originalPrice}</span>
                                    <span className="text-emerald-400 font-bold">{discountPercent}% off</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-gray-400 space-y-2">
                          <p className="text-sm font-bold text-gray-200">No matching books found</p>
                          <p className="text-xs text-gray-500 max-w-xs mx-auto">
                            Check for typos or press Enter to search the full digital catalog.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div
                      onClick={handleSearchSubmit}
                      className="p-3 bg-[#111319] hover:bg-white/10 border-t border-gray-800 text-xs font-bold text-amber-400 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Search size={14} />
                        See all results for &quot;{searchTerm}&quot; in Books
                      </span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ) : (
                  /* 2. When search input is empty or focused (Flipkart-style Trending/Popular tags) */
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                      <TrendingUp size={14} className="text-amber-400" />
                      <span>Trending &amp; Popular Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((query) => (
                        <button
                          key={query}
                          type="button"
                          onClick={() => handleTrendingClick(query)}
                          className="flex items-center gap-1.5 bg-[#1f232e] hover:bg-white/15 text-gray-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-gray-700/60 hover:border-gray-500"
                        >
                          <Search size={12} className="text-gray-400" />
                          <span>{query}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav Actions - Desktop */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <Link
              to="/books"
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/books'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass size={18} />
              <span>Explore</span>
            </Link>

            {/* My Orders Link */}
            <Link
              to="/orders"
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/orders'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package size={18} />
              <span>My Orders</span>
              {orders.length > 0 && (
                <span className="bg-amber-400 text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {orders.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart"
              id="nav-cart-link"
              className="relative flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-transform active:scale-95"
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-black text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Profile / Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-200 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 shadow-sm">
                  <User size={16} className="text-amber-400" />
                  <span className="font-bold text-white max-w-[140px] truncate" title={user?.name}>
                    {user?.name ? user.name.split(' ')[0] : 'My Account'}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 border border-gray-600 text-sm font-semibold px-3.5 py-2 rounded-lg text-white hover:bg-white/10 hover:border-white transition-all"
              >
                <User size={16} />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu & Cart Controls */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 text-white hover:bg-white/10 rounded-lg"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar with Flipkart/Meesho Item Preview */}
        <div ref={mobileSearchRef} className="pb-3 md:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search books, authors, genres..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-9 pr-8 py-2 bg-[#181b22] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:border-white"
            />
            {isSearching ? (
              <Loader2 size={14} className="absolute right-3 text-gray-400 animate-spin" />
            ) : searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSearchPreview([]);
                }}
                className="absolute right-3 text-gray-400"
              >
                <X size={14} />
              </button>
            ) : null}
          </form>

          {/* Mobile Search Preview Dropdown */}
          {showDropdown && searchTerm.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#161922] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-800">
                {searchPreview.map((book) => {
                  const discountPercent =
                    book.originalPrice && book.originalPrice > book.price
                      ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
                      : 0;

                  return (
                    <div
                      key={book._id}
                      onClick={() => handleSelectBook(book._id)}
                      className="p-2.5 flex items-center gap-2.5 hover:bg-white/5 cursor-pointer"
                    >
                      <img
                        src={book.image}
                        alt={book.title}
                        className="w-9 h-12 object-cover rounded shadow flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{book.title}</h4>
                        <p className="text-[11px] text-gray-400 truncate">by {book.author}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] bg-emerald-600/20 text-emerald-400 px-1 rounded font-bold">
                            ★ {book.rating || '4.8'}
                          </span>
                          <span className="text-[9px] text-gray-400 truncate">in {book.category}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-extrabold text-white">₹{book.price}</div>
                        {discountPercent > 0 && (
                          <div className="text-[9px] text-emerald-400 font-bold">{discountPercent}% off</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                onClick={handleSearchSubmit}
                className="p-2.5 bg-[#111319] border-t border-gray-800 text-[11px] font-bold text-amber-400 flex items-center justify-between"
              >
                <span>See all results on Search Page</span>
                <ArrowRight size={12} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#181b22] border-t border-gray-800 px-4 pt-3 pb-5 space-y-3 animate-fadeIn">
          <Link
            to="/books"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold py-2 text-gray-200 hover:text-white"
          >
            <Compass size={18} />
            <span>Explore All Books</span>
          </Link>

          <Link
            to="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-sm font-semibold py-2 text-gray-200 hover:text-white"
          >
            <div className="flex items-center gap-2">
              <Package size={18} />
              <span>My Orders &amp; Digital Copies</span>
            </div>
            {orders.length > 0 && (
              <span className="bg-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-sm font-semibold py-2 text-gray-200 hover:text-white"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>Cart</span>
            </div>
            {cartCount > 0 && (
              <span className="bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount} items
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-gray-700 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User size={18} />
                <span>Signed in as <strong>{user?.name}</strong></span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-600/20 text-red-400 py-2 rounded-lg text-sm font-semibold hover:bg-red-600/30"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-gray-700 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2 bg-white text-black rounded-lg text-sm font-bold"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2 border border-gray-600 text-white rounded-lg text-sm font-bold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
