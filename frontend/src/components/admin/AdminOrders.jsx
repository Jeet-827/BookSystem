import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Eye,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  RefreshCw,
  IndianRupee,
  ShieldCheck,
  Receipt,
  Download,
  Calendar,
  User,
  Zap,
} from 'lucide-react';
import MoonLoader from '../MoonLoader';

const AdminOrders = ({ initialView = 'orders' }) => {
  const [viewMode, setViewMode] = useState(initialView); // 'orders' | 'payments' | 'refunds'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState(
    initialView === 'payments' ? 'paid' : initialView === 'refunds' ? 'cancelled' : 'all'
  );
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [metrics, setMetrics] = useState({
    totalCollectedAmount: 0,
    paidCount: 0,
    totalOrders: 0,
  });

  // Sync when initialView prop updates
  useEffect(() => {
    if (initialView === 'payments') {
      setViewMode('payments');
      setStatusFilter('paid');
      setPage(1);
    } else if (initialView === 'refunds') {
      setViewMode('refunds');
      setStatusFilter('cancelled');
      setPage(1);
    } else if (initialView === 'orders') {
      setViewMode('orders');
      setStatusFilter('all');
      setPage(1);
    }
  }, [initialView]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setOrdersError('');
    try {
      const params = {
        page,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      };
      const res = await api.get('/admin/orders', { params });
      if (res.data.success) {
        setOrders(res.data.orders || []);
        setTotalPages(res.data.pages || res.data.totalPages || 1);
        setTotalCount(res.data.total || res.data.totalOrders || 0);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      } else {
        setOrdersError(res.data.message || 'Failed to load orders.');
      }
    } catch (err) {
      setOrdersError(
        err.response?.data?.message || err.message || 'Unable to fetch orders from server.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabSwitch = (newMode) => {
    setViewMode(newMode);
    setPage(1);
    if (newMode === 'payments') {
      setStatusFilter('paid');
    } else if (newMode === 'refunds') {
      setStatusFilter('cancelled');
    } else {
      setStatusFilter('all');
    }
  };

  const handleProcessRefund = async (orderId, decision) => {
    if (!window.confirm(`Are you sure you want to ${decision} the refund for this order?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/orders/${orderId}/refund`, {
        action: decision, // 'approve' or 'reject'
        adminNote: `Refund ${decision}d by admin`,
      });
      if (res.data.success) {
        setMessage(`Order refund successfully ${decision}d.`);
        setTimeout(() => setMessage(''), 4000);
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(res.data.order);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing refund');
    } finally {
      setActionLoading(false);
    }
  };

  const getMethodIcon = (method) => {
    const m = (method || '').toLowerCase();
    if (m === 'razorpay') return <Zap size={13} className="text-amber-400" />;
    if (m === 'card') return <CreditCard size={13} className="text-blue-400" />;
    if (m === 'upi') return <Smartphone size={13} className="text-violet-400" />;
    if (m === 'netbanking') return <Landmark size={13} className="text-emerald-400" />;
    return <Wallet size={13} className="text-amber-400" />;
  };

  // Local fallback calculations for slice
  const pagePaymentRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const displayRevenue = metrics.totalCollectedAmount > 0 ? metrics.totalCollectedAmount : pagePaymentRevenue;
  const completedOrdersCount = orders.filter((o) => o.orderStatus === 'completed' || o.paymentStatus === 'paid').length;
  const displayPaidCount = metrics.paidCount > 0 ? metrics.paidCount : completedOrdersCount;
  const pendingRefundsCount = orders.filter((o) => o.refundStatus === 'requested').length;

  // Filter orders by payment method client-side if methodFilter is set
  const filteredOrders = methodFilter === 'all'
    ? orders
    : orders.filter((o) => (o.paymentMethod || '').toLowerCase() === methodFilter.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Title & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <span>Digital Orders &amp; Sales Management</span>
          </h2>
          <p className="text-xs text-gray-400">
            Real-time tracking of all customer orders, Razorpay collected payments, and instant eBook delivery ({totalCount} total orders).
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-center"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs font-medium">
          {message}
        </div>
      )}

      {/* Prominent Order & Payment Total KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/40 p-4 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              Total Collected Payments
            </span>
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg">
              <IndianRupee size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
            ₹{displayRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
            Lifetime Net Customer Collections
          </p>
        </div>

        <div className="bg-[#13161c] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Paid &amp; Captured</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{displayPaidCount}</div>
          <p className="text-[11px] text-gray-400 mt-1">Instant eBooks unlocked</p>
        </div>

        <div className="bg-[#13161c] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {metrics.totalOrders || totalCount}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Total placed digital orders</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/30 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Refund Requests</span>
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
              <RotateCcw size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">{pendingRefundsCount}</div>
          <p className="text-[11px] text-amber-400/80 mt-1">Awaiting 24-hr resolution</p>
        </div>
      </div>

      {/* Primary Sub-Tab Switcher for Admin Views */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => handleTabSwitch('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            viewMode === 'orders'
              ? 'bg-white text-black shadow-md'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Package size={14} />
          <span>All Digital Orders</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 text-current">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch('payments')}
          id="admin-collected-payments-tab"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            viewMode === 'payments'
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <IndianRupee size={14} />
          <span>Collected Payments (Paid)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-current">
            ₹{displayRevenue.toLocaleString('en-IN')}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch('refunds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            viewMode === 'refunds'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <RotateCcw size={14} />
          <span>Refund Requests</span>
          {pendingRefundsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-black animate-pulse">
              {pendingRefundsCount}
            </span>
          )}
        </button>
      </div>

      {/* Info Banner when in Collected Payments mode */}
      {viewMode === 'payments' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-emerald-300">
                Verified Collected Payments Ledger
              </h4>
              <p className="text-[11px] text-emerald-400/80">
                Showing all customer payments successfully captured via Razorpay, UPI, cards, and netbanking with instant digital eBook download confirmation.
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
              Total Settled
            </span>
            <span className="text-base font-black text-emerald-300">
              ₹{displayRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Filters Strip */}
      <div className="bg-[#13161c] p-4 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by Order ID, Razorpay ID, Invoice, or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1b1f28] border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Method Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-bold hidden sm:inline">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-[#1b1f28] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
            >
              <option value="all">All Methods</option>
              <option value="razorpay">Razorpay</option>
              <option value="card">Cards</option>
              <option value="upi">UPI</option>
              <option value="netbanking">NetBanking</option>
            </select>
          </div>

          {/* Status Filter */}
          {viewMode === 'orders' && (
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#1b1f28] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="paid">Paid (Captured)</option>
                <option value="cancelled">Cancelled / Refunded</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Orders / Payments Table */}
      <div className="bg-[#13161c] rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
        {loading && filteredOrders.length === 0 ? (
          <div className="py-20 flex justify-center">
            <MoonLoader size={40} color="#10b981" text="Loading payments & orders..." />
          </div>
        ) : ordersError ? (
          <div className="py-12 px-6 text-center space-y-3">
            <p className="text-sm font-bold text-red-400">{ordersError}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-bold transition-all"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <Package size={40} className="mx-auto text-gray-600" />
            <p className="text-sm font-semibold">No digital orders or payments found</p>
            <p className="text-xs text-gray-500">
              {search ? 'Try clearing your search query' : 'Place an order in checkout to see it appear here live.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181c24] text-gray-400 uppercase font-bold tracking-wider text-[10px] border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">
                    {viewMode === 'payments' ? 'Transaction / Razorpay ID' : 'Order Number'}
                  </th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items / eBooks</th>
                  <th className="px-4 py-3">Gateway</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Status</th>
                  {viewMode !== 'payments' && <th className="px-4 py-3">Refund Status</th>}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {filteredOrders.map((order) => {
                  const isRefundRequested = order.refundStatus === 'requested';
                  const isRefundApproved = order.refundStatus === 'approved';
                  const isPaid = order.paymentStatus === 'paid' || order.orderStatus === 'completed';
                  const transactionDisplay =
                    order.paymentDetails?.razorpayPaymentId ||
                    order.transactionId ||
                    order.orderNumber ||
                    order._id;

                  return (
                    <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* ID Column */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-white text-xs">
                            {transactionDisplay}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {order.invoiceNumber || order.orderNumber}
                          </p>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="truncate max-w-[140px]">
                          <p className="font-bold text-white truncate">
                            {order.user?.name || 'Customer'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {order.user?.email || 'customer@gmail.com'}
                          </p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">
                          {order.items?.length || 0} eBook(s)
                        </span>
                        <p className="text-[10px] text-gray-500 truncate max-w-[130px]">
                          {order.items?.[0]?.title}
                        </p>
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 capitalize font-medium">
                          {getMethodIcon(order.paymentMethod)}
                          <span className="text-[11px]">{order.paymentMethod || 'Razorpay'}</span>
                        </div>
                      </td>

                      {/* Amount Collected */}
                      <td className="px-4 py-3 font-extrabold text-emerald-400 text-sm">
                        ₹{order.totalAmount}
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={11} /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {order.paymentStatus || 'Pending'}
                          </span>
                        )}
                      </td>

                      {/* Refund Status (if applicable) */}
                      {viewMode !== 'payments' && (
                        <td className="px-4 py-3">
                          {isRefundApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/20">
                              Refunded
                            </span>
                          ) : isRefundRequested ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                              <Clock size={11} /> Review Needed
                            </span>
                          ) : (
                            <span className="text-gray-500 text-[11px]">—</span>
                          )}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[11px] font-bold"
                            title="View Payment Receipt & Details"
                          >
                            <Receipt size={13} className="text-amber-400" />
                            <span>Receipt</span>
                          </button>

                          {isRefundRequested && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleProcessRefund(order._id, 'approve')}
                                disabled={actionLoading}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessRefund(order._id, 'reject')}
                                disabled={actionLoading}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>
              Page {page} of {totalPages} ({totalCount} total entries)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-white/5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-white/5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Receipt & Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#13161c] border border-gray-800 rounded-2xl max-w-xl w-full p-6 space-y-5 text-white max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-display">
                    Payment Receipt &amp; Breakdown
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {selectedOrder.orderNumber || selectedOrder._id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Payment Summary Box */}
              <div className="grid grid-cols-2 gap-3 bg-[#181c24] p-3.5 rounded-xl border border-gray-800">
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Transaction / Gateway ID
                  </span>
                  <span className="font-mono text-white font-bold text-xs select-all">
                    {selectedOrder.paymentDetails?.razorpayPaymentId ||
                      selectedOrder.transactionId ||
                      'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Official Invoice
                  </span>
                  <span className="font-mono text-gray-200">
                    {selectedOrder.invoiceNumber || 'INV-DIGITAL'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Customer Name &amp; Email
                  </span>
                  <span className="text-gray-200 font-medium">
                    {selectedOrder.user?.name || 'Customer'} ({selectedOrder.user?.email || 'N/A'})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Total Amount Collected
                  </span>
                  <span className="font-black text-emerald-400 text-base">
                    ₹{selectedOrder.totalAmount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Payment Gateway
                  </span>
                  <span className="capitalize text-gray-200 flex items-center gap-1 font-bold">
                    {selectedOrder.paymentMethod || 'Razorpay'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Payment Status
                  </span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Captured &amp; Settled
                  </span>
                </div>
              </div>

              {selectedOrder.refundReason && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300 space-y-1">
                  <span className="font-bold block">Refund Reason:</span>
                  <p>{selectedOrder.refundReason}</p>
                </div>
              )}

              {/* Purchased eBooks list */}
              <div>
                <h4 className="font-bold text-gray-400 mb-2">
                  Purchased Digital eBooks ({selectedOrder.items?.length || 0}):
                </h4>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#181c24] p-3 rounded-xl border border-gray-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.image ||
                            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
                          }
                          alt={item.title}
                          className="w-10 h-14 object-cover rounded shadow-xs"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{item.title}</p>
                          <p className="text-gray-400 text-[11px]">by {item.author}</p>
                          <p className="text-gray-500 text-[10px]">
                            Format: <strong className="text-white">{item.fileFormat || 'PDF'}</strong> • Qty: {item.quantity || 1}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-white text-xs">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-800">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-400" />
                redkitindia 100% Digital Store
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
