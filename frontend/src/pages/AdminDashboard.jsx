import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api, { setAccessToken, setFallbackRefreshToken } from '../api/api';
import { loginUser, logoutUser } from '../store/slices/authSlice';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminStats from '../components/admin/AdminStats';
import AdminFilters from '../components/admin/AdminFilters';
import AdminBooksTable from '../components/admin/AdminBooksTable';
import AdminBookForm from '../components/admin/AdminBookForm';
import AdminActivity from '../components/admin/AdminActivity';
import AdminOrders from '../components/admin/AdminOrders';
import AdminLogin from '../components/admin/AdminLogin';
import ChangePasswordModal from '../components/admin/ChangePasswordModal';
import MoonLoader from '../components/MoonLoader';
import SEOHead from '../components/SEOHead';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, sessionChecking, loading: authLoading } = useSelector((state) => state.auth);

  const isAdmin = isAuthenticated && user && (user.role === 'admin' || user.role === 'superadmin');

  // State
  const [activeTab, setActiveTab] = useState('books');
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [booksError, setBooksError] = useState('');
  const [statsError, setStatsError] = useState('');
  const [logsError, setLogsError] = useState('');
  const [actionError, setActionError] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [selectedBookIds, setSelectedBookIds] = useState([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Debounce search input & reset page on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCategoryChange = useCallback((newCategory) => {
    setCategory(newCategory);
    setPage(1);
  }, []);

  // Fetch Dashboard Overview Stats
  const fetchStats = useCallback(async () => {
    setStatsError('');
    try {
      const res = await api.get('/admin/dashboard/stats');
      if (res.data?.success) {
        setStats(res.data.stats);
      } else {
        setStatsError(res.data?.message || 'Failed to load dashboard statistics.');
      }
    } catch (err) {
      setStatsError(
        err.response?.data?.message || err.message || 'Unable to load dashboard statistics.'
      );
    }
  }, []);

  // Fetch Books
  const fetchBooksData = useCallback(async () => {
    setLoading(true);
    setBooksError('');
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
        category: category !== 'All' ? category : undefined,
      };
      const res = await api.get('/admin/books', { params });
      if (res.data?.success) {
        setBooks(res.data.books || []);
        setTotalPages(res.data.totalPages || res.data.pages || 1);
        setTotalBooks(res.data.totalBooks ?? (res.data.books?.length || 0));
      } else {
        setBooksError(res.data?.message || 'Failed to fetch books from server.');
      }
    } catch (err) {
      setBooksError(
        err.response?.data?.message ||
          err.message ||
          'Failed to fetch books. Please check server connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category]);

  // Fetch Logs
  const fetchActivityLogs = useCallback(async () => {
    setLogsError('');
    try {
      const res = await api.get('/admin/dashboard/activity');
      if (res.data?.success) {
        setLogs(res.data.logs || []);
      } else {
        setLogsError(res.data?.message || 'Failed to load activity logs.');
      }
    } catch (err) {
      setLogsError(
        err.response?.data?.message || err.message || 'Unable to load activity logs.'
      );
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      if (activeTab === 'books') fetchBooksData();
      if (activeTab === 'activity') fetchActivityLogs();
    }
  }, [isAdmin, activeTab, fetchStats, fetchBooksData, fetchActivityLogs]);

  // Refresh All
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchBooksData(), fetchActivityLogs()]);
    setRefreshing(false);
  };

  // Login Handler: authenticate directly against dedicated Admin Server
  const handleAdminLogin = async (creds) => {
    setLoginError('');
    try {
      // 1. Authenticate with dedicated Admin Server on port 5001 / booksystem-1
      const res = await api.post('/admin/auth/login', creds);
      if (res.data?.success) {
        if (res.data.accessToken) {
          setAccessToken(res.data.accessToken);
        }
        if (res.data.refreshToken) {
          setFallbackRefreshToken(res.data.refreshToken);
        }
        // Sync Redux auth state
        dispatch({
          type: 'auth/login/fulfilled',
          payload: res.data,
        });
        return;
      }
      throw new Error(res.data?.message || 'Admin authentication failed');
    } catch (adminErr) {
      // Fallback: try customer backend login
      try {
        const result = await dispatch(loginUser(creds)).unwrap();
        if (result.user?.role !== 'admin' && result.user?.role !== 'superadmin') {
          setLoginError('Access denied: You do not have administrator privileges.');
          dispatch(logoutUser());
        }
      } catch (err) {
        setLoginError(adminErr.response?.data?.message || err || 'Invalid email or password');
      }
    }
  };

  // Logout Handler
  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Book Actions
  const handleSaveBook = async (formData) => {
    setSaving(true);
    try {
      if (editingBook) {
        await api.put(`/admin/books/${editingBook._id}`, formData);
      } else {
        await api.post('/admin/books', formData);
      }
      setIsFormOpen(false);
      setEditingBook(null);
      fetchBooksData();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving book');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (book) => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      try {
        await api.delete(`/admin/books/${book._id}`);
        fetchBooksData();
        fetchStats();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting book');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete ${selectedBookIds.length} books?`
      )
    ) {
      try {
        await api.post('/admin/books/bulk-delete', { ids: selectedBookIds });
        setSelectedBookIds([]);
        fetchBooksData();
        fetchStats();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting books');
      }
    }
  };

  const handleToggleFeatured = async (id) => {
    setActionError('');
    try {
      await api.patch(`/admin/books/${id}/toggle-featured`);
      fetchBooksData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update featured status.');
    }
  };

  const handleToggleBestseller = async (id) => {
    setActionError('');
    try {
      await api.patch(`/admin/books/${id}/toggle-bestseller`);
      fetchBooksData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update bestseller status.');
    }
  };

  const handleSeedCatalog = async () => {
    if (
      window.confirm(
        'WARNING: This will reset all current books and re-seed the sample catalog. Proceed?'
      )
    ) {
      setActionError('');
      try {
        await api.post(
          '/admin/books/seed',
          { confirm: true },
          { headers: { 'x-confirm-destructive': 'true' } }
        );
        fetchBooksData();
        fetchStats();
      } catch (err) {
        setActionError(err.response?.data?.message || 'Error seeding database');
      }
    }
  };

  // Checkbox Selection
  const handleSelectAll = () => {
    if (selectedBookIds.length === books.length) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(books.map((b) => b._id));
    }
  };

  const handleSelectBook = (id) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (sessionChecking) {
    return (
      <div className="bg-[#0b0c0e] min-h-screen text-white flex items-center justify-center">
        <MoonLoader size={48} color="#3b82f6" text="Verifying administrator session..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-[#0b0c0e] min-h-screen text-white font-sans">
        <AdminLogin onLogin={handleAdminLogin} loading={authLoading} error={loginError} />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Admin Portal"
        description="redkitindia Administrator Portal."
        canonical="/admin"
        noIndex={true}
      />
      <div className="bg-[#0b0c0e] min-h-screen text-white font-sans flex flex-col overflow-x-hidden">
      <AdminHeader
        adminUser={user}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreateModal={() => {
            setEditingBook(null);
            setIsFormOpen(true);
          }}
          onSeedCatalog={handleSeedCatalog}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {statsError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-red-300">
              <span>{statsError}</span>
              <button
                type="button"
                onClick={fetchStats}
                className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {actionError && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300">
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError('')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          <AdminStats stats={stats} />

          {activeTab === 'books' && (
            <div className="space-y-4">
              <AdminFilters
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={handleCategoryChange}
                selectedCount={selectedBookIds.length}
                onBulkDelete={handleBulkDelete}
              />

              <AdminBooksTable
                books={books}
                loading={loading}
                error={booksError}
                onRetry={fetchBooksData}
                hasActiveFilters={Boolean(search.trim() || category !== 'All')}
                onClearFilters={() => {
                  setSearch('');
                  setCategory('All');
                  setPage(1);
                }}
                onAddBook={() => {
                  setEditingBook(null);
                  setIsFormOpen(true);
                }}
                selectedBookIds={selectedBookIds}
                onSelectAll={handleSelectAll}
                onSelectBook={handleSelectBook}
                onEditBook={(book) => {
                  setEditingBook(book);
                  setIsFormOpen(true);
                }}
                onDeleteBook={handleDeleteBook}
                onToggleFeatured={handleToggleFeatured}
                onToggleBestseller={handleToggleBestseller}
              />

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-gray-400 font-bold">
                    Page {page} of {totalPages} ({totalBooks} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300 disabled:opacity-30 hover:bg-white/10 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300 disabled:opacity-30 hover:bg-white/10 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && <AdminOrders initialView="orders" />}

          {activeTab === 'payments' && <AdminOrders initialView="payments" />}

          {activeTab === 'activity' && (
            <AdminActivity logs={logs} loading={loading} error={logsError} onRetry={fetchActivityLogs} />
          )}

          {activeTab === 'system' && (
            <div className="p-6 bg-[#13161c] border border-gray-800 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-white">System Diagnostics</h3>
              <p className="text-xs text-gray-400">
                Dedicated Admin API Server operational (port 5001 locally / booksystem-1 in production) with isolated admin authentication, MongoDB Atlas persistence, ImageKit cover uploads, and Google Drive digital file storage.
              </p>
            </div>
          )}
        </main>
      </div>

      <AdminBookForm
        book={editingBook}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveBook}
        saving={saving}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
    </>
  );
};

export default AdminDashboard;
