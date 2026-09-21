import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectOrders, requestRefund } from '../store/slices/cartSlice';
import {
  Package,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';

const Orders = () => {
  const dispatch = useDispatch();
  const orders = useSelector(selectOrders);

  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('Changed my mind');
  const [refundSuccessMsg, setRefundSuccessMsg] = useState('');

  const handleDownloadFile = useCallback((url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleConfirmRefund = useCallback(() => {
    if (selectedOrderForRefund) {
      dispatch(
        requestRefund({
          orderId: selectedOrderForRefund.orderId,
          reason: refundReason,
        })
      );
      setRefundSuccessMsg(
        `Refund for ${selectedOrderForRefund.orderId} initiated! ₹${selectedOrderForRefund.totalAmount} will be credited to your account within 24 Hours (1 Day).`
      );
      setSelectedOrderForRefund(null);
      setTimeout(() => setRefundSuccessMsg(''), 6000);
    }
  }, [selectedOrderForRefund, refundReason, dispatch]);

  if (orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Package size={56} className="text-gray-400 mx-auto" />
        <h2 className="text-2xl font-extrabold text-gray-900 font-display">No Orders Placed Yet</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          You haven't made any purchases yet. Browse our bestsellers with instant digital downloads & 1-day easy refund protection!
        </p>
        <Link
          to="/books"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-xs font-bold hover:bg-gray-800"
        >
          <span>Start Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">
            My Orders & Digital Library
          </h1>
          <p className="text-xs text-gray-500">
            Track your deliveries, download digital copies, and manage 1-day instant refunds.
          </p>
        </div>

        {/* 1-Day Refund Policy Banner */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>1-Day Instant Refund Policy Active</span>
        </div>
      </div>

      {/* Refund Success Alert */}
      {refundSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium shadow-sm animate-fadeIn">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <span>{refundSuccessMsg}</span>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => {
          const isRefunded = !!order.refundStatus;

          return (
            <div
              key={order.orderId}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Order Meta Header */}
              <div className="bg-slate-50 px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <span className="text-gray-400 block font-bold uppercase text-[10px]">Order ID</span>
                    <span className="font-extrabold text-gray-900">{order.orderId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold uppercase text-[10px]">Date Placed</span>
                    <span className="font-bold text-gray-900">{order.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold uppercase text-[10px]">Total Paid</span>
                    <span className="font-extrabold text-gray-900">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isRefunded ? (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 font-extrabold px-3 py-1 rounded-full text-xs">
                      <Clock size={14} className="text-amber-600" />
                      <span>{order.status}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 font-extrabold px-3 py-1 rounded-full text-xs">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Confirmed & Dispatched</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-5 divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div
                    key={item._id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                        <p className="text-xs text-gray-500">
                          by {item.author} • Qty: {item.quantity || 1} •{' '}
                          <strong className="text-gray-900">₹{item.price}</strong>
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1">
                          <Sparkles size={10} /> Digital copy unlocked
                        </span>
                      </div>
                    </div>

                    {/* Download Digital Copy Button */}
                    <button
                      onClick={() => handleDownloadFile(item.downloadUrl)}
                      className="inline-flex items-center justify-center gap-1.5 bg-black text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-all self-start sm:self-center"
                    >
                      <Download size={14} className="text-amber-400" />
                      <span>Download {item.fileFormat || 'PDF'}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Footer & 1-Day Refund Action */}
              <div className="bg-slate-50 px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {isRefunded ? (
                  <div className="text-amber-800 font-medium flex items-center gap-1.5">
                    <Clock size={15} />
                    <span>
                      1-Day Refund in progress: <strong>₹{order.refundStatus.refundAmount}</strong> will be refunded within 24 hours.
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Eligible for instant 1-day return & full refund guarantee.</span>
                  </div>
                )}

                {!isRefunded && (
                  <button
                    onClick={() => setSelectedOrderForRefund(order)}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg self-start sm:self-auto transition-colors"
                  >
                    <RotateCcw size={13} />
                    <span>Request 1-Day Refund</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-Day Refund Confirmation Modal */}
      {selectedOrderForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-900">
                <RotateCcw size={20} className="text-red-600" />
                <h3 className="font-extrabold text-base font-display">1-Day Instant Refund</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForRefund(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-gray-600">
              <p>
                You are requesting a refund for order{' '}
                <strong className="text-gray-900">{selectedOrderForRefund.orderId}</strong> worth{' '}
                <strong className="text-gray-900">₹{selectedOrderForRefund.totalAmount}</strong>.
              </p>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900 text-xs font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={15} /> 1-Day Refund Guarantee
                </p>
                <p>100% of your payment will be credited back to your original payment method within 24 hours.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Return Reason:</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-black"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found a better price">Found a better price</option>
                  <option value="Book condition issue">Book condition issue</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSelectedOrderForRefund(null)}
                className="py-2.5 px-4 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Confirm 1-Day Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
