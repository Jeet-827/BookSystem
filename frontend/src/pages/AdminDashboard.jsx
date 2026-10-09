import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/api';
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

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);

  const isAdmin = isAuthenticated && user && user.role === 'admin';

  // State
  const [activeTab, setActiveTab] = useState('books');
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBookIds, setSelectedBookIds] = useState([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch Dashboard Overview Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch Books
  const fetchBooksData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        category: category !== 'All' ? category : undefined,
        stockStatus: stockStatus || undefined,
      };
      const res = await api.get('/admin/books', { params });
      if (res.data.success) {
        setBooks(res.data.books || []);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch admin books:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, stockStatus]);

  // Fetch Logs
  const fetchActivityLogs = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard/activity');
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
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

  // Login Handler
  const handleAdminLogin = async (creds) => {
    setLoginError('');
    try {
      const result = await dispatch(loginUser(creds)).unwrap();
      if (result.user?.role !== 'admin') {
        setLoginError('Access denied: You do not have administrator privileges.');
        dispatch(logoutUser());
      }
    } catch (err) {
      setLoginError(err || 'Invalid email or password');
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
        `Are you sure you want to delete ${selectedBookIds.length} selected books?`
      )
    ) {
      try {
        await api.post('/admin/books/bulk-delete', { ids: selectedBookIds });
        setSelectedBookIds([]);
        fetchBooksData();
        fetchStats();
      } catch (err) {
        alert(err.response?.data?.message || 'Error executing bulk delete');
      }
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await api.patch(`/admin/books/${id}/toggle-featured`);
      fetchBooksData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBestseller = async (id) => {
    try {
      await api.patch(`/admin/books/${id}/toggle-bestseller`);
      fetchBooksData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (id, stock) => {
    try {
      await api.patch(`/admin/books/${id}/stock`, { stock: Number(stock) });
      fetchBooksData();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedCatalog = async () => {
    if (
      window.confirm(
        'WARNING: This will reset all current books and re-seed the sample catalog. Proceed?'
      )
    ) {
      try {
        await api.post('/admin/books/seed');
        fetchBooksData();
        fetchStats();
      } catch (err) {
        alert(err.response?.data?.message || 'Error seeding database');
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

  if (!isAdmin) {
    return (
      <div className="bg-[#0b0c0e] min-h-screen text-white font-sans">
        <AdminLogin onLogin={handleAdminLogin} loading={authLoading} error={loginError} />
      </div>
    );
  }

  return (
    <div className="bg-[#0b0c0e] min-h-screen text-white font-sans flex flex-col">
      <AdminHeader
        adminUser={user}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreateModal={() => {
            setEditingBook(null);
            setIsFormOpen(true);
          }}
          onSeedCatalog={handleSeedCatalog}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <AdminStats stats={stats} />

          {activeTab === 'books' && (
            <div className="space-y-4">
              <AdminFilters
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                stockStatus={stockStatus}
                setStockStatus={setStockStatus}
                selectedCount={selectedBookIds.length}
                onBulkDelete={handleBulkDelete}
              />

              <AdminBooksTable
                books={books}
                loading={loading}
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
                onUpdateStock={handleUpdateStock}
              />

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500 font-bold">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && <AdminOrders />}

          {activeTab === 'activity' && <AdminActivity logs={logs} loading={loading} />}

          {activeTab === 'system' && (
            <div className="p-6 bg-[#13161c] border border-gray-800 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-white">System Diagnostics</h3>
              <p className="text-xs text-gray-400">
                Single unified backend operational on port 5000 serving both customer storefront and administrator APIs.
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
    </div>
  );
};

export default AdminDashboard;
