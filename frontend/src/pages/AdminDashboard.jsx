import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import adminApi, { setAdminToken, getAdminToken } from '../api/adminApi';
import MoonLoader from '../components/MoonLoader';
import {
  BookOpen,
  LayoutDashboard,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Package,
  Layers,
  Star,
  ExternalLink,
  X,
  Lock,
  Mail,
  ShieldCheck,
  RefreshCw,
  LogOut,
  IndianRupee,
} from 'lucide-react';

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

const AdminDashboard = () => {
  // Auth State
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAdminToken()));
  const [authLoading, setAuthLoading] = useState(true);
  const [loginCreds, setLoginCreds] = useState({ email: 'admin@bookmart.com', password: 'Admin@123456' });
  const [loginError, setLoginError] = useState('');

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'stats' | 'activity'
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState('all');
  const [sort, setSort] = useState('newest');

  // Modals & Editing State
  const [editingBook, setEditingBook] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmBook, setDeleteConfirmBook] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'Fiction',
    stock: 10,
    image: '',
    downloadUrl: '',
    fileFormat: 'PDF',
    fileSize: '4.5 MB',
    pages: 200,
    publisher: '',
    publishedYear: 2024,
    isFeatured: false,
    isBestseller: false,
  });

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  }, []);

  // Check Admin Session
  const verifySession = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await adminApi.get('/auth/me');
      if (res.data?.admin) {
        setAdminUser(res.data.admin);
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
      setAdminUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Fetch Books
  const fetchBooks = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params = {
        limit: 50,
        sort,
      };
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (stockStatus !== 'all') params.stockStatus = stockStatus;

      const res = await adminApi.get('/books', { params });
      if (res.data?.books) {
        setBooks(res.data.books);
        setTotalBooks(res.data.totalBooks || res.data.books.length);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, search, category, stockStatus, sort, showToast]);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await adminApi.get('/dashboard/stats');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // Fetch Activity Logs
  const fetchActivity = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await adminApi.get('/dashboard/activity');
      if (res.data?.logs) {
        setActivityLogs(res.data.logs);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBooks();
      fetchStats();
      fetchActivity();
    }
  }, [isAuthenticated, fetchBooks, fetchStats, fetchActivity]);

  // Admin Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await adminApi.post('/auth/login', loginCreds);
      if (res.data?.accessToken) {
        setAdminToken(res.data.accessToken);
        setAdminUser(res.data.admin);
        setIsAuthenticated(true);
        showToast(`Welcome back, ${res.data.admin.name || 'Admin'}!`);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid admin credentials');
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.post('/auth/logout');
    } finally {
      setAdminToken(null);
      setIsAuthenticated(false);
      setAdminUser(null);
      showToast('Admin signed out.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      price: book.price || '',
      originalPrice: book.originalPrice || '',
      category: book.category || 'Fiction',
      stock: book.stock ?? 10,
      image: book.image || '',
      downloadUrl: book.downloadUrl || '',
      fileFormat: book.fileFormat || 'PDF',
      fileSize: book.fileSize || '4.5 MB',
      pages: book.pages || 200,
      publisher: book.publisher || '',
      publishedYear: book.publishedYear || 2024,
      isFeatured: Boolean(book.isFeatured),
      isBestseller: Boolean(book.isBestseller),
    });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      price: 399,
      originalPrice: 599,
      category: 'Fiction',
      stock: 25,
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
      downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileFormat: 'PDF',
      fileSize: '4.2 MB',
      pages: 250,
      publisher: 'Penguin Classics',
      publishedYear: 2024,
      isFeatured: false,
      isBestseller: false,
    });
    setIsCreateModalOpen(true);
  };

  // Submit Save/Edit Book
  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        const res = await adminApi.put(`/books/${editingBook._id}`, formData);
        showToast(res.data?.message || 'Book updated successfully!');
        setEditingBook(null);
      } else {
        const res = await adminApi.post('/books', formData);
        showToast(res.data?.message || 'Book created successfully!');
        setIsCreateModalOpen(false);
      }
      fetchBooks();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save book');
    }
  };

  // Delete Book
  const handleConfirmDelete = async () => {
    if (!deleteConfirmBook) return;
    try {
      await adminApi.delete(`/books/${deleteConfirmBook._id}`);
      showToast(`Book "${deleteConfirmBook.title}" deleted.`);
      setDeleteConfirmBook(null);
      fetchBooks();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete book');
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (bookId) => {
    try {
      const res = await adminApi.patch(`/books/${bookId}/toggle-featured`);
      showToast(res.data?.message || 'Updated featured status');
      setBooks((prev) =>
        prev.map((b) => (b._id === bookId ? { ...b, isFeatured: res.data.isFeatured } : b))
      );
      fetchStats();
    } catch (err) {
      showToast('Error updating featured flag');
    }
  };

  // Toggle Bestseller
  const handleToggleBestseller = async (bookId) => {
    try {
      const res = await adminApi.patch(`/books/${bookId}/toggle-bestseller`);
      showToast(res.data?.message || 'Updated bestseller status');
      setBooks((prev) =>
        prev.map((b) => (b._id === bookId ? { ...b, isBestseller: res.data.isBestseller } : b))
      );
      fetchStats();
    } catch (err) {
      showToast('Error updating bestseller flag');
    }
  };

  // Quick Stock Update
  const handleQuickStockChange = async (bookId, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      const res = await adminApi.patch(`/books/${bookId}/stock`, { stock: newStock });
      setBooks((prev) =>
        prev.map((b) => (b._id === bookId ? { ...b, stock: res.data.book.stock } : b))
      );
      fetchStats();
    } catch (err) {
      showToast('Failed to update stock');
    }
  };

  // Reseed Sample Books
  const handleReseedCatalog = async () => {
    if (!window.confirm('Are you sure you want to reset & reseed the book catalog with sample titles?')) return;
    try {
      const res = await adminApi.post('/books/seed');
      showToast(res.data?.message || 'Catalog reset and reseeded!');
      fetchBooks();
      fetchStats();
    } catch (err) {
      showToast('Error reseeding catalog');
    }
  };

  // 1. Loading Gateway
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0f12] flex items-center justify-center p-4">
        <MoonLoader size={48} color="#ffffff" text="Verifying Admin Privileges..." />
      </div>
    );
  }

  // 2. Admin Login Gateway Modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d0f12] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#181b22] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-white text-black rounded-xl shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-extrabold font-display">BookMart Admin Portal</h1>
            <p className="text-xs text-gray-400">
              Sign in with administrative credentials to manage books, pricing, and system inventory.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Admin Email</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-gray-400" />
                <input
                  type="email"
                  required
                  value={loginCreds.email}
                  onChange={(e) => setLoginCreds({ ...loginCreds, email: e.target.value })}
                  placeholder="admin@bookmart.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Admin Password</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3 text-gray-400" />
                <input
                  type="password"
                  required
                  value={loginCreds.password}
                  onChange={(e) => setLoginCreds({ ...loginCreds, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black py-2.5 rounded-lg text-xs sm:text-sm font-extrabold hover:bg-gray-200 active:scale-95 transition-all shadow"
            >
              Sign In to Admin Dashboard
            </button>
          </form>

          {/* Preset Fill Helper */}
          <div className="pt-2 border-t border-gray-800 text-center">
            <button
              type="button"
              onClick={() => setLoginCreds({ email: 'admin@bookmart.com', password: 'Admin@123456' })}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
            >
              ⚡ Click to Auto-fill Default Admin Credentials
            </button>
            <p className="text-[11px] text-gray-500 mt-1">
              (admin@bookmart.com / Admin@123456)
            </p>
          </div>

          <div className="text-center pt-2">
            <Link to="/" className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1">
              <span>&larr; Return to Customer Store</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard Layout
  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white border border-gray-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#16181f] border-b border-gray-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white text-black rounded-lg">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg font-display tracking-tight text-white">
                BookMart Admin
              </h1>
              <span className="bg-amber-400 text-black text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                Management Portal
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Microservice: Port 5001 • Database: bookmart</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-white/5 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Live Store</span>
            <ExternalLink size={13} />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-800/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* KPI Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#181b22] border border-gray-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Books</p>
              <h3 className="text-2xl font-extrabold text-white mt-1 font-display">{totalBooks}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Package size={24} />
            </div>
          </div>

          <div className="bg-[#181b22] border border-gray-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Inventory Value</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1 font-display">
                ₹{stats?.inventory?.totalInventoryValue?.toLocaleString() || (totalBooks * 450).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <IndianRupee size={24} />
            </div>
          </div>

          <div className="bg-[#181b22] border border-gray-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Featured / Bestseller</p>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-1 font-display">
                {books.filter((b) => b.isBestseller || b.isFeatured).length}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Sparkles size={24} />
            </div>
          </div>

          <div className="bg-[#181b22] border border-gray-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Low / Out of Stock</p>
              <h3 className="text-2xl font-extrabold text-rose-400 mt-1 font-display">
                {books.filter((b) => (b.stock || 0) <= 5).length}
              </h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="bg-[#181b22] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('books')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'books'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Books Catalog ({totalBooks})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'activity'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Activity Audit Logs
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleReseedCatalog}
              title="Reset and reload default seed books"
              className="inline-flex items-center gap-1.5 border border-gray-700 bg-[#0f1115] hover:bg-white/5 text-gray-300 px-3 py-2 rounded-lg text-xs font-bold transition-all"
            >
              <RotateCcw size={13} />
              <span>Reseed Sample Books</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-lg text-xs font-extrabold hover:bg-gray-200 active:scale-95 transition-all shadow"
            >
              <Plus size={15} />
              <span>Add New Book</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Books Catalog Management */}
        {activeTab === 'books' && (
          <div className="bg-[#181b22] border border-gray-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
              {/* Search Bar */}
              <div className="lg:col-span-5 relative flex items-center">
                <Search size={16} className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books by title, author, publisher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white"
                />
              </div>

              {/* Category Filter */}
              <div className="lg:col-span-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Filter */}
              <div className="lg:col-span-2">
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-white"
                >
                  <option value="all">All Stock Status</option>
                  <option value="in">In Stock (&gt; 0)</option>
                  <option value="low">Low Stock (&le; 5)</option>
                  <option value="out">Out of Stock (0)</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="lg:col-span-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="stock_asc">Stock: Low to High</option>
                  <option value="stock_desc">Stock: High to Low</option>
                </select>
              </div>
            </div>

            {/* Books Table */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <MoonLoader size={40} color="#ffffff" text="Loading Books..." />
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl">📚</div>
                <h3 className="text-lg font-extrabold text-white">No books match your criteria</h3>
                <p className="text-xs text-gray-400">Try clearing your search query or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0f1115] uppercase tracking-wider text-[11px] text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="py-3.5 px-4">Book Details</th>
                      <th className="py-3.5 px-3">Category</th>
                      <th className="py-3.5 px-3">Price</th>
                      <th className="py-3.5 px-3">Stock</th>
                      <th className="py-3.5 px-3 text-center">Featured / Best</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {books.map((book) => (
                      <tr key={book._id} className="hover:bg-white/5 transition-colors">
                        {/* Book Info */}
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded shadow flex-shrink-0 bg-gray-800"
                          />
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-white text-xs sm:text-sm truncate" title={book.title}>
                              {book.title}
                            </h4>
                            <p className="text-[11px] text-gray-400 truncate">by {book.author}</p>
                            <span className="text-[10px] text-amber-400 font-mono">
                              ⭐ {book.rating || 4.5} ({(book.reviewCount || 100).toLocaleString()})
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3">
                          <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[11px] font-bold">
                            {book.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-white text-sm">₹{book.price}</div>
                          {book.originalPrice > book.price && (
                            <div className="text-[10px] text-gray-500 line-through">₹{book.originalPrice}</div>
                          )}
                        </td>

                        {/* Stock Counter with Quick +/- Buttons */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleQuickStockChange(book._id, book.stock, -1)}
                              className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center font-bold text-xs"
                              title="Decrease stock"
                            >
                              -
                            </button>
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                (book.stock || 0) === 0
                                  ? 'bg-rose-950 text-rose-300'
                                  : (book.stock || 0) <= 5
                                  ? 'bg-amber-950 text-amber-300'
                                  : 'bg-emerald-950 text-emerald-300'
                              }`}
                            >
                              {book.stock || 0}
                            </span>
                            <button
                              onClick={() => handleQuickStockChange(book._id, book.stock, 1)}
                              className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center font-bold text-xs"
                              title="Increase stock"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Badges Toggle */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleFeatured(book._id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                book.isFeatured
                                  ? 'bg-amber-400 text-black font-extrabold'
                                  : 'bg-gray-800 text-gray-500 hover:text-white'
                              }`}
                              title="Toggle Featured on homepage"
                            >
                              Featured
                            </button>
                            <button
                              onClick={() => handleToggleBestseller(book._id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                book.isBestseller
                                  ? 'bg-emerald-500 text-white font-extrabold'
                                  : 'bg-gray-800 text-gray-500 hover:text-white'
                              }`}
                              title="Toggle Bestseller badge"
                            >
                              Bestseller
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(book)}
                              className="p-1.5 bg-white/10 hover:bg-white text-white hover:text-black rounded-lg transition-all"
                              title="Edit Book Details"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmBook(book)}
                              className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all"
                              title="Delete Book"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Activity Audit Logs */}
        {activeTab === 'activity' && (
          <div className="bg-[#181b22] border border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-white font-display">Administrative Activity Logs</h3>
            <p className="text-xs text-gray-400">
              Audit trails of all book creations, updates, stock modifications, and deletions.
            </p>

            {activityLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                No administrative activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-800 text-xs">
                {activityLogs.map((log) => (
                  <div key={log._id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-white uppercase bg-white/10 px-2 py-0.5 rounded text-[10px] mr-2">
                        {log.action}
                      </span>
                      <span className="text-gray-300">
                        {log.details?.title ? `"${log.details.title}"` : log.targetType}
                      </span>
                      <span className="text-gray-500 text-[11px] ml-2">
                        by {log.admin?.name || 'Admin'}
                      </span>
                    </div>
                    <span className="text-gray-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: Edit / Create Book Form */}
      {(editingBook || isCreateModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181b22] border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit size={18} className="text-white" />
                <h3 className="font-extrabold text-base text-white font-display">
                  {editingBook ? `Edit: ${editingBook.title}` : 'Add New Book to Catalog'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingBook(null);
                  setIsCreateModalOpen(false);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveBook} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Description / Synopsis */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">Description / Synopsis *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                />
              </div>

              {/* Price, Original Price, Stock, Category */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Original Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Stock Copies *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white font-bold"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cover Image URL & Digital Download URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Digital PDF Download URL</label>
                  <input
                    type="url"
                    value={formData.downloadUrl}
                    onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                    placeholder="https://.../book.pdf"
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Publisher, Pages, Year */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Page Count</label>
                  <input
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Published Year</label>
                  <input
                    type="number"
                    value={formData.publishedYear}
                    onChange={(e) => setFormData({ ...formData, publishedYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0f1115] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Checkboxes: Featured & Bestseller */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="accent-white w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-white">Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isBestseller}
                    onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                    className="accent-white w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-white">Mark as Bestseller</span>
                </label>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBook(null);
                    setIsCreateModalOpen(false);
                  }}
                  className="px-4 py-2 border border-gray-700 rounded-lg font-bold text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-extrabold rounded-lg hover:bg-gray-200 shadow"
                >
                  {editingBook ? 'Save Changes' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteConfirmBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181b22] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={22} />
              <h3 className="font-extrabold text-base font-display">Delete Book</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{deleteConfirmBook.title}"</strong>? This will remove the book from the active catalog and customer store.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmBook(null)}
                className="py-2 px-4 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow"
              >
                Delete Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
