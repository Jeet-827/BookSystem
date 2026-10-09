import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchUserOrders,
  requestOrderRefund,
  getDownloadLink,
} from '../store/slices/ordersSlice';
import MoonLoader from '../components/MoonLoader';
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
  BookOpen,
  FileText,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  Library,
  Layers,
  ExternalLink,
  Info,
} from 'lucide-react';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'orders'
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('Changed my mind');
  const [refundSuccessMsg, setRefundSuccessMsg] = useState('');
  const [readerModalItem, setReaderModalItem] = useState(null);
  const [downloadSuccessItem, setDownloadSuccessItem] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserOrders());
    }
  }, [dispatch, isAuthenticated]);

  const handleDownloadFile = useCallback((item, order) => {
    const url =
      item.digitalFileKey ||
      item.downloadUrl ||
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    // If order has an ID, we can also dispatch backend download tracking
    if (order?._id && item._id) {
      dispatch(getDownloadLink({ orderId: order._id, itemId: item._id }));
    }

    // Trigger direct download / open tab
    window.open(url, '_blank', 'noopener,noreferrer');
    setDownloadSuccessItem(item.title);
    setTimeout(() => setDownloadSuccessItem(null), 4000);
  }, [dispatch]);

  const handleConfirmRefund = useCallback(async () => {
    if (selectedOrderForRefund) {
      try {
        await dispatch(
          requestOrderRefund({
            orderId: selectedOrderForRefund._id || selectedOrderForRefund.orderId,
            reason: refundReason,
          })
        ).unwrap();

        setRefundSuccessMsg(
          `Refund requested for order ${selectedOrderForRefund.orderNumber || selectedOrderForRefund.orderId}! Amount ₹${selectedOrderForRefund.totalAmount} will be returned within 24 hours.`
        );
        setSelectedOrderForRefund(null);
        setTimeout(() => setRefundSuccessMsg(''), 6000);
      } catch (err) {
        alert(err || 'Failed to request refund');
      }
    }
  }, [selectedOrderForRefund, refundReason, dispatch]);

  // Aggregate all unique purchased books for the "My Offline Library" view
  const libraryBooks = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const booksMap = new Map();

    orders.forEach((order) => {
      if (order.refundStatus === 'approved') return; // Don't show refunded books
      order.items?.forEach((item) => {
        const id = item.book?._id || item.book || item._id;
        if (!booksMap.has(id)) {
          booksMap.set(id, {
            ...item,
            orderDate: order.createdAt || order.date,
            orderNumber: order.orderNumber,
            parentOrder: order,
          });
        }
      });
    });

    return Array.from(booksMap.values());
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <BookOpen size={40} />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 font-display">Sign In to Access Your Library</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Please log in to your account to view your purchased eBooks, download files, and read offline.
        </p>
        <Link
          to="/login?redirect=orders"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
        >
          <span>Sign In</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28 flex flex-col items-center justify-center">
        <MoonLoader size={48} color="#000000" text="Loading your digital library & orders..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display flex items-center gap-2">
            <span>Offline eBook Library & Orders</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Download your digital editions anytime, read offline on any device, and manage 24-hr refund guarantees.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-center">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'library'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Library size={15} />
            <span>My Digital Library ({libraryBooks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'orders'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Layers size={15} />
            <span>Order History ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {downloadSuccessItem && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <span>
            Download started for <strong>"{downloadSuccessItem}"</strong>! Your offline eBook file is ready.
          </span>
        </div>
      )}

      {refundSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <span>{refundSuccessMsg}</span>
        </div>
      )}

      {/* No Orders / Empty Library */}
      {orders.length === 0 && !loading && (
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <BookOpen size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 font-display">No eBooks Purchased Yet</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You haven't purchased any digital editions yet. Explore our bestsellers and unlock instant offline reading right away!
          </p>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95"
          >
            <span>Browse Bestselling eBooks</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* TAB 1: MY DIGITAL LIBRARY (OFFLINE READY) */}
      {activeTab === 'library' && libraryBooks.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-full">
                Offline Mode Active
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display">
                Your Offline Reading Bookshelf
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                All eBooks purchased on BookMart are permanently yours with unlimited re-downloads. Download PDF or EPUB files to read on Kindle, iPad, Android, or laptop offline.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold font-display">{libraryBooks.length}</span>
              <span className="text-xs text-slate-300 font-medium">eBooks Ready for Offline Reading</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {libraryBooks.map((item, idx) => (
              <div
                key={`${item._id || idx}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative bg-slate-100 aspect-[3/4] overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={item.title}
                      className="h-full w-auto object-cover rounded shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                      {item.fileFormat || 'PDF'}
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500">by {item.author}</p>
                    <p className="text-[11px] text-gray-400">
                      File Size: {item.fileSize || '4.5 MB'}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2">
                  <button
                    onClick={() => handleDownloadFile(item, item.parentOrder)}
                    className="w-full bg-black text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Download size={14} className="text-amber-400" />
                    <span>Download {item.fileFormat || 'PDF'}</span>
                  </button>

                  <button
                    onClick={() => setReaderModalItem(item)}
                    className="w-full border border-gray-200 text-gray-700 hover:text-black hover:border-black py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen size={13} />
                    <span>Quick Read Offline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COMPLETE ORDER HISTORY */}
      {activeTab === 'orders' && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => {
            const isRefundRequested = order.refundStatus === 'requested';
            const isRefundApproved = order.refundStatus === 'approved';
            const isRefundRejected = order.refundStatus === 'rejected';

            // Payment method icon
            const renderMethodIcon = () => {
              if (order.paymentMethod === 'card') return <CreditCard size={14} />;
              if (order.paymentMethod === 'upi') return <Smartphone size={14} />;
              if (order.paymentMethod === 'netbanking') return <Landmark size={14} />;
              return <Wallet size={14} />;
            };

            return (
              <div
                key={order._id || order.orderNumber}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Meta Header */}
                <div className="bg-slate-50 px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[10px]">
                        Order Number
                      </span>
                      <span className="font-extrabold text-gray-900 font-mono">
                        {order.orderNumber || order._id}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[10px]">
                        Date
                      </span>
                      <span className="font-semibold text-gray-700">
                        {new Date(order.createdAt || order.date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[10px]">
                        Payment
                      </span>
                      <span className="font-bold text-gray-800 flex items-center gap-1 capitalize">
                        {renderMethodIcon()}
                        {order.paymentMethod || 'Card'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block font-bold uppercase text-[10px]">
                        Total Amount
                      </span>
                      <span className="font-extrabold text-gray-900 text-sm">
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {isRefundApproved ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-900 font-extrabold px-3 py-1 rounded-full text-xs">
                        <CheckCircle2 size={13} /> Refunded (₹{order.refundAmount || order.totalAmount})
                      </span>
                    ) : isRefundRequested ? (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-extrabold px-3 py-1 rounded-full text-xs">
                        <Clock size={13} /> 24h Refund Under Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 font-extrabold px-3 py-1 rounded-full text-xs">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Payment Confirmed & Unlocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 divide-y divide-gray-100">
                  {order.items?.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            item.image ||
                            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
                          }
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded shadow-sm border border-gray-100 flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500">
                            by {item.author} • Qty: {item.quantity || 1} •{' '}
                            <strong className="text-gray-900">₹{item.price}</strong>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <Sparkles size={10} /> Instant Download Available
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Format: {item.fileFormat || 'PDF'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Download Action */}
                      {!isRefundApproved ? (
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <button
                            onClick={() => handleDownloadFile(item, order)}
                            className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95"
                          >
                            <Download size={14} className="text-amber-400" />
                            <span>Download eBook</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-bold self-start sm:self-center">
                          Access Revoked (Refunded)
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer with 1-Day Refund Policy */}
                <div className="bg-slate-50 px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {isRefundRequested ? (
                    <div className="text-amber-800 font-medium flex items-center gap-1.5">
                      <Clock size={15} />
                      <span>
                        Refund request in progress for ₹{order.refundAmount || order.totalAmount}. Processed within 24 hours.
                      </span>
                    </div>
                  ) : isRefundApproved ? (
                    <div className="text-gray-500 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-gray-400" />
                      <span>Order refunded. Payment credited back to your account.</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                      <span>Protected by 24-Hour Instant Refund Guarantee.</span>
                    </div>
                  )}

                  {!isRefundRequested && !isRefundApproved && (
                    <button
                      onClick={() => setSelectedOrderForRefund(order)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold border border-red-200 bg-red-50 hover:bg-red-100 px-3.5 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
                    >
                      <RotateCcw size={13} />
                      <span>Request 24-Hour Refund</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK OFFLINE READER MODAL */}
      {readerModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-black" />
                <h3 className="font-extrabold text-lg text-gray-900 font-display">
                  Offline Reader Preview
                </h3>
              </div>
              <button
                onClick={() => setReaderModalItem(null)}
                className="p-1 text-gray-400 hover:text-black rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
                <img
                  src={
                    readerModalItem.image ||
                    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
                  }
                  alt={readerModalItem.title}
                  className="w-16 h-22 object-cover rounded shadow"
                />
                <div>
                  <h4 className="text-base font-extrabold text-gray-900">
                    {readerModalItem.title}
                  </h4>
                  <p className="text-xs text-gray-600">by {readerModalItem.author}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Format: {readerModalItem.fileFormat || 'PDF'} • DRM-Free
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Info size={15} /> Offline Reading Tip
                </p>
                <p>
                  You can download the full digital copy below and open it with your favorite offline reader like Apple Books, Adobe Acrobat, Calibre, or Google Play Books!
                </p>
              </div>

              <div className="p-4 bg-slate-100 rounded-xl font-serif text-sm text-gray-800 leading-relaxed max-h-48 overflow-y-auto space-y-2 border border-gray-200">
                <p className="font-bold text-xs font-sans uppercase tracking-widest text-gray-500">
                  Excerpt Preview: Chapter 1
                </p>
                <p>
                  "The light that spills across the pages of an unread story holds more promise than any destination. To read is to travel through minds and epochs without leaving your seat..."
                </p>
                <p>
                  "In the quiet of early mornings, when thoughts are clear and ideas spark, a good book is a loyal mentor. Every lesson absorbed becomes an invisible shield in times of uncertainty."
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setReaderModalItem(null)}
                className="py-2.5 px-4 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  handleDownloadFile(readerModalItem, readerModalItem.parentOrder);
                  setReaderModalItem(null);
                }}
                className="py-2.5 px-4 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                <Download size={14} className="text-amber-400" />
                <span>Download Full eBook</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 24-HOUR REFUND MODAL */}
      {selectedOrderForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-900">
                <RotateCcw size={20} className="text-red-600" />
                <h3 className="font-extrabold text-base font-display">24-Hour Instant Refund</h3>
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
                Request refund for order{' '}
                <strong className="text-gray-900 font-mono">
                  {selectedOrderForRefund.orderNumber || selectedOrderForRefund._id}
                </strong>{' '}
                worth <strong className="text-gray-900">₹{selectedOrderForRefund.totalAmount}</strong>.
              </p>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 text-xs font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={15} /> 24-Hour Refund Guarantee
                </p>
                <p>
                  100% of your payment will be credited back to your original payment method within 24 hours. Digital book downloads will be deactivated upon processing.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason for refund:</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 text-xs font-medium focus:outline-none focus:border-black"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Purchased wrong format">Purchased wrong format (wanted EPUB)</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found another book">Found another title</option>
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
                Confirm Refund Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
