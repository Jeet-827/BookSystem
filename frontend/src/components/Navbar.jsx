import React, { useState, memo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { selectCartCount, selectOrders } from '../store/slices/cartSlice';
import { setFilter } from '../store/slices/booksSlice';
import {
  Search,
  ShoppingBag,
  User,
  BookOpen,
  LogOut,
  Compass,
  Menu,
  X,
  Package,
} from 'lucide-react';

const Navbar = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartCount);
  const orders = useSelector(selectOrders);

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (searchTerm.trim()) {
        dispatch(setFilter({ search: searchTerm.trim() }));
        navigate('/books');
        setMobileMenuOpen(false);
      }
    },
    [searchTerm, dispatch, navigate]
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
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="p-2 bg-white text-black rounded-lg transition-transform group-hover:scale-105">
              <BookOpen size={22} strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-white font-display">
                BookMart
              </span>
              <span className="text-[10px] uppercase font-bold bg-white text-black px-1.5 py-0.5 rounded tracking-wider">
                Plus
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl relative items-center"
          >
            <Search size={18} className="absolute left-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search books, authors, genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#181b22] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
          </form>

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
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-200">
                  <User size={18} className="text-gray-400" />
                  <span className="max-w-[120px] truncate">{user?.name?.split(' ')[0]}</span>
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

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search books, authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#181b22] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:border-white"
            />
          </form>
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
              <span>My Orders & Digital Copies</span>
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
