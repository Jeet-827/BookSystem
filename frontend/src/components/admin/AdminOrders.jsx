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
} from 'lucide-react';
import MoonLoader from '../MoonLoader';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
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
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
    if (method === 'card') return <CreditCard size={13} className="text-blue-400" />;
    if (method === 'upi') return <Smartphone size={13} className="text-violet-400" />;
    if (method === 'netbanking') return <Landmark size={13} className="text-emerald-400" />;
    return <Wallet size={13} className="text-amber-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            Digital Orders & Ebook Downloads
          </h2>
          <p className="text-xs text-gray-400">
            Monitor real-time digital sales, customer downloads, and 24-hr refund requests ({totalCount} total orders).
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-center"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs font-medium">
          {message}
        </div>
      )}

      {/* Filters Strip */}
      <div className="bg-[#13161c] p-4 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by Order ID, Transaction ID, or User..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1b1f28] border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#1b1f28] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
          >
            <option value="all">All Orders</option>
            <option value="completed">Completed (Paid)</option>
            <option value="cancelled">Refunded / Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#13161c] rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
        {loading && orders.length === 0 ? (
          <div className="py-20 flex justify-center">
            <MoonLoader size={40} color="#f59e0b" text="Loading digital orders..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <Package size={40} className="mx-auto text-gray-600" />
            <p className="text-sm font-semibold">No digital orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181c24] text-gray-400 uppercase font-bold tracking-wider text-[10px] border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Ebooks</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Refund Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {orders.map((order) => {
                  const isRefundRequested = order.refundStatus === 'requested';
                  const isRefundApproved = order.refundStatus === 'approved';

                  return (
                    <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {order.orderNumber || order._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">
                          {order.items?.length || 0} eBook(s)
                        </span>
                        <p className="text-[10px] text-gray-500 truncate max-w-[150px]">
                          {order.items?.[0]?.title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 capitalize font-medium">
                          {getMethodIcon(order.paymentMethod)}
                          <span>{order.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-white">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> {order.orderStatus}
                        </span>
                      </td>
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>

                          {isRefundRequested && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleProcessRefund(order._id, 'approve')}
                                disabled={actionLoading}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                              >
                                Approve Refund
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
              Page {page} of {totalPages}
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13161c] border border-gray-800 rounded-2xl max-w-xl w-full p-6 space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="font-extrabold text-lg font-display">Order Details</h3>
                <p className="text-xs text-gray-400 font-mono">
                  {selectedOrder.orderNumber || selectedOrder._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#181c24] p-3 rounded-xl border border-gray-800">
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Transaction ID
                  </span>
                  <span className="font-mono text-gray-200">
                    {selectedOrder.transactionId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Invoice
                  </span>
                  <span className="font-mono text-gray-200">
                    {selectedOrder.invoiceNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Payment Method
                  </span>
                  <span className="capitalize text-gray-200">
                    {selectedOrder.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-bold">
                    Amount Paid
                  </span>
                  <span className="font-extrabold text-amber-400 text-sm">
                    ₹{selectedOrder.totalAmount}
                  </span>
                </div>
              </div>

              {selectedOrder.refundReason && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300 space-y-1">
                  <span className="font-bold block">Refund Reason:</span>
                  <p>{selectedOrder.refundReason}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-400 mb-2">Ordered eBooks:</h4>
                <div className="space-y-2">
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
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div>
                          <p className="font-bold text-white">{item.title}</p>
                          <p className="text-gray-400 text-[11px]">by {item.author}</p>
                          <p className="text-gray-500 text-[10px]">
                            {item.fileFormat || 'PDF'} • {item.fileSize || 'Standard'}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-white">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
