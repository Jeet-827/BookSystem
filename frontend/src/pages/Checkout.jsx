import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCartItems,
  selectCartTotal,
  clearCart,
} from '../store/slices/cartSlice';
import {
  createRazorpayOrder,
  placeOrder,
  clearOrderState,
  getDownloadLink,
} from '../store/slices/ordersSlice';
import {
  Lock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Package,
  Loader2,
  FileText,
  AlertTriangle,
  Zap,
  X,
} from 'lucide-react';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, sessionChecking } = useSelector((state) => state.auth);
  const { placingOrder, paymentProcessing, lastPlacedOrder, error } = useSelector(
    (state) => state.orders
  );

  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);

  const [step, setStep] = useState('payment'); // 'payment' | 'processing' | 'success'
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [modalStatus, setModalStatus] = useState('processing'); // 'processing' | 'success'
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [downloadingItems, setDownloadingItems] = useState({});
  const [downloadErrors, setDownloadErrors] = useState({});

  // Redirect if unauthenticated (only after session check completes)
  useEffect(() => {
    if (!sessionChecking && !isAuthenticated) {
      navigate('/login?redirect=checkout');
    }
  }, [sessionChecking, isAuthenticated, navigate]);

  // Redirect if cart empty and not on success screen
  useEffect(() => {
    if (!sessionChecking && cartItems.length === 0 && step !== 'success') {
      navigate('/cart');
    }
  }, [sessionChecking, cartItems.length, step, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearOrderState());
    };
  }, [dispatch]);

  // Ensure modal closes if lastPlacedOrder is populated
  useEffect(() => {
    if (lastPlacedOrder && step === 'success') {
      setShowWarningModal(false);
    }
  }, [lastPlacedOrder, step]);

  // Automatically dismiss modal on error
  useEffect(() => {
    if (error && showWarningModal) {
      setShowWarningModal(false);
      setStep('payment');
    }
  }, [error, showWarningModal]);

  // ─── Coupon: client only shows what we'll send; server does authoritative calc ───
  // The coupon code is sent to the server; the server independently validates and
  // calculates the actual discount. The client preview is informational only.
  const CLIENT_COUPON_PREVIEW = {
    READMORE: 10,
    FIRST50: 50,
    BOOK20: 20,
  };

  const applyCoupon = useCallback(() => {
    const code = couponCode.trim().toUpperCase();
    const percent = CLIENT_COUPON_PREVIEW[code];
    if (percent !== undefined) {
      setCouponDiscount(Math.round(total * (percent / 100)));
      setCouponApplied(true);
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
    }
  }, [couponCode, total]);

  // This is a client-side preview only. Actual final amount is server-calculated.
  const previewFinalAmount = useMemo(
    () => Math.max(0, total - couponDiscount),
    [total, couponDiscount]
  );

  // Inject Razorpay Checkout SDK
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // ─── Secure download via backend proxy ───────────────────────────────────────
  // C-05 fix: Downloads go through the authenticated backend endpoint.
  // Raw file URLs are never shown to the client directly.
  const handleDownloadItem = useCallback(
    async (orderId, itemId, title) => {
      if (!orderId || !itemId) return;
      setDownloadingItems((prev) => ({ ...prev, [itemId]: true }));
      setDownloadErrors((prev) => ({ ...prev, [itemId]: null }));
      try {
        const result = await dispatch(getDownloadLink({ orderId, itemId })).unwrap();
        if (result?.downloadUrl) {
          // Open the authenticated download URL in a new tab
          window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
        } else {
          setDownloadErrors((prev) => ({
            ...prev,
            [itemId]: 'Download is not available yet. Please contact support.',
          }));
        }
      } catch (err) {
        setDownloadErrors((prev) => ({
          ...prev,
          [itemId]: err || 'Download failed. Please try again.',
        }));
      } finally {
        setDownloadingItems((prev) => ({ ...prev, [itemId]: false }));
      }
    },
    [dispatch]
  );

  const handleDownloadAll = useCallback(() => {
    if (!lastPlacedOrder?.items) return;
    lastPlacedOrder.items.forEach((item, index) => {
      setTimeout(() => {
        handleDownloadItem(lastPlacedOrder._id, String(item._id), item.title);
      }, index * 600);
    });
  }, [lastPlacedOrder, handleDownloadItem]);

  // ─── Real two-step Razorpay payment flow ──────────────────────────────────────
  const handleRazorpayPayment = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }

    setShowWarningModal(true);
    setModalStatus('processing');

    try {
      // Step 1: Create server-side Razorpay order
      const orderData = await dispatch(
        createRazorpayOrder({
          items: cartItems,
          couponCode: couponApplied ? couponCode.trim().toUpperCase() : '',
        })
      ).unwrap();

      const { orderId, amount, currency, keyId } = orderData;

      if (!window.Razorpay) {
        setShowWarningModal(false);
        setStep('payment');
        // Razorpay SDK not loaded
        alert('Payment gateway failed to load. Please refresh and try again.');
        return;
      }

      // Step 2: Open Razorpay checkout with the real server-created order
      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'redkitindia',
        description: `Digital eBook Order (${cartItems.length} items)`,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#0f1115' },
        handler: async function (response) {
          // Step 3: Server verifies the signature and creates the order record
          setModalStatus('processing');
          try {
            await dispatch(
              placeOrder({
                items: cartItems,
                paymentDetails: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                },
                couponCode: couponApplied ? couponCode.trim().toUpperCase() : '',
              })
            ).unwrap();

            setModalStatus('success');
            setTimeout(() => {
              setShowWarningModal(false);
              setStep('success');
              dispatch(clearCart());
            }, 900);
          } catch (orderErr) {
            setShowWarningModal(false);
            setStep('payment');
          }
        },
        modal: {
          ondismiss: () => {
            setShowWarningModal(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setShowWarningModal(false);
        setStep('payment');
      });
      rzp.open();
    } catch (err) {
      setShowWarningModal(false);
      setStep('payment');
    }
  }, [
    isAuthenticated,
    cartItems,
    user,
    couponApplied,
    couponCode,
    dispatch,
    navigate,
  ]);

  // Loading state during session restoration
  if (sessionChecking) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={40} className="animate-spin text-black mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Restoring checkout session...</p>
        </div>
      </div>
    );
  }

  // =========== ORDER SUCCESS & DOWNLOAD SCREEN ===========
  if (step === 'success' && lastPlacedOrder) {
    const order = lastPlacedOrder;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-6">
          {/* Success Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">
              Payment Confirmed!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
              Your digital eBooks are ready for{' '}
              <strong className="text-black">instant download</strong>.
            </p>
          </div>

          {/* Order Details Bar */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Order</span>
              <span className="font-extrabold text-gray-900">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Invoice</span>
              <span className="font-bold text-gray-900">{order.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Gateway</span>
              <span className="font-bold text-blue-600">Razorpay Verified</span>
            </div>
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Paid</span>
              <span className="font-extrabold text-emerald-700">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Purchased Items Download List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 font-display flex items-center gap-2">
                <FileText size={16} />
                <span>Your Purchased eBooks ({order.items?.length || 0})</span>
              </h3>
              {order.items?.length > 1 && (
                <button
                  onClick={handleDownloadAll}
                  className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Download size={13} />
                  <span>Download All</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {order.items?.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between flex-wrap gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 rounded overflow-hidden shadow-sm flex-shrink-0 bg-gray-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FileText size={14} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">{item.title}</h4>
                      <p className="text-[11px] text-gray-500">
                        by {item.author} •{' '}
                        <strong className="text-black">{item.fileFormat || 'PDF'}</strong>{' '}
                        ({item.fileSize || 'N/A'})
                      </p>
                      {downloadErrors[String(item._id)] && (
                        <p className="text-[10px] text-red-500 mt-0.5">
                          {downloadErrors[String(item._id)]}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleDownloadItem(order._id, String(item._id), item.title)
                    }
                    disabled={downloadingItems[String(item._id)]}
                    className="bg-gradient-to-r from-gray-900 to-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:from-black hover:to-gray-800 flex items-center gap-1.5 ml-auto sm:ml-0 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                  >
                    {downloadingItems[String(item._id)] ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} className="text-amber-400" />
                    )}
                    <span>
                      {downloadingItems[String(item._id)]
                        ? 'Loading...'
                        : `Download ${item.fileFormat || 'PDF'}`}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Post-Purchase Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 shadow transition-all active:scale-95"
            >
              <Package size={16} />
              <span>Go to My Digital Library</span>
            </Link>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 border border-black bg-white text-black px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all"
            >
              <span>Explore More Books</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========== CHECKOUT PAYMENT SCREEN ===========
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Payment Processing Modal */}
      {showWarningModal && (
        <div
          id="razorpay-warning-popup"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-[#13161c] border-2 border-amber-500 w-full max-w-md rounded-2xl shadow-2xl p-6 text-white text-center space-y-5 animate-in fade-in zoom-in duration-200 relative">
            <button
              onClick={() => setShowWarningModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Cancel"
            >
              <X size={18} />
            </button>

            {modalStatus === 'success' ? (
              <div className="space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-xl font-extrabold text-emerald-400">Payment Successful!</h2>
                <p className="text-xs text-gray-300">
                  Payment verified. Opening your digital library...
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto animate-pulse">
                  <AlertTriangle size={32} />
                </div>

                <div className="space-y-2">
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30">
                    Razorpay Payment Processing
                  </span>
                  <h2 className="text-xl font-extrabold font-display text-white">
                    Do Not Click the Back Button
                  </h2>
                  <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                    Please do not press the Back button, close your browser, or refresh until the web page automatically reopens.
                  </p>
                </div>

                <div className="bg-black/60 border border-gray-800 rounded-xl p-4 flex items-center justify-center gap-3">
                  <Loader2 size={20} className="text-amber-400 animate-spin flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Secure Gateway Active</p>
                    <p className="text-[11px] text-gray-400">Communicating with Razorpay servers...</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 px-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>redkitindia 256-bit Encrypted Checkout</span>
                  </div>
                  <button
                    onClick={() => setShowWarningModal(false)}
                    className="text-gray-400 hover:text-white underline text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link to="/cart" className="hover:text-black flex items-center gap-1 font-medium">
          <ArrowLeft size={14} />
          <span>Back to Cart</span>
        </Link>
        <span>•</span>
        <span className="font-bold text-black">redkitindia Instant Digital Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Payment Gateway */}
        <section className="lg:col-span-7 space-y-6">
          {/* Digital Info Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-400 text-black rounded-lg font-bold">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="text-base font-extrabold font-display">100% Online Digital eBooks</h2>
                <p className="text-xs text-gray-300">
                  We do not deliver physical books. Download files immediately after payment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
                <Download size={14} className="text-amber-400" />
                <span className="font-medium text-[11px]">Instant Download</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="font-medium text-[11px]">24h Refund Policy</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2 col-span-2 sm:col-span-1">
                <Sparkles size={14} className="text-blue-400" />
                <span className="font-medium text-[11px]">PDF / EPUB / Kindle</span>
              </div>
            </div>
          </div>

          {/* Razorpay Gateway */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-gray-900" />
                <h3 className="text-base font-extrabold text-gray-900 font-display">
                  Payment via Razorpay
                </h3>
              </div>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                Official Gateway
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Click below to complete payment securely with Razorpay. Supports{' '}
              <strong>UPI (GPay, PhonePe, Paytm)</strong>,{' '}
              <strong>Credit &amp; Debit Cards</strong>, and <strong>NetBanking</strong>.
            </p>

            {/* Auth Status */}
            {isAuthenticated ? (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="font-extrabold text-emerald-950">
                      Logged In: {user?.name || 'Customer'}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {user?.email ? `${user.email} • Verified Account` : 'Verified Account'}
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={11} /> Verified
                </span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-800 font-extrabold">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                  <span>Login Required for Payment</span>
                </div>
                <p className="text-amber-700 text-[11px] leading-relaxed">
                  Please log in to securely purchase and access your digital library.
                </p>
                <Link
                  to="/login?redirect=checkout"
                  className="inline-flex items-center gap-1.5 bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                >
                  <Lock size={12} />
                  <span>Log In to Proceed</span>
                </Link>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Pay Button */}
            {isAuthenticated ? (
              <button
                onClick={handleRazorpayPayment}
                disabled={placingOrder || paymentProcessing || showWarningModal}
                id="pay-razorpay-btn"
                className="w-full bg-black text-white hover:bg-gray-800 active:scale-98 transition-all py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {placingOrder || paymentProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} className="text-amber-400" />
                    <span>
                      Pay ₹{previewFinalAmount.toLocaleString('en-IN')} with Razorpay
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate('/login?redirect=checkout')}
                id="pay-razorpay-btn"
                className="w-full bg-black text-white hover:bg-gray-800 active:scale-98 transition-all py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Lock size={16} className="text-amber-400" />
                <span>Log In to Pay with Razorpay</span>
              </button>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>PCI-DSS Certified • Signature-Verified Checkout</span>
            </div>
          </div>
        </section>

        {/* Right: Order Summary & Coupon */}
        <section className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 font-display pb-3 border-b border-gray-100">
              Order Summary ({cartItems.length} {cartItems.length === 1 ? 'eBook' : 'eBooks'})
            </h3>

            {/* Item List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-8 h-11 object-cover rounded shadow-xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-11 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <FileText size={12} className="text-gray-400" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-bold text-gray-900 truncate">{item.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.fileFormat || 'PDF'} • Qty: {item.quantity || 1}
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-gray-900 flex-shrink-0">
                    ₹{item.price * (item.quantity || 1)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Discount Coupon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. READMORE, FIRST50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs uppercase font-bold focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="px-3.5 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponApplied && (
                <p className="text-[11px] text-emerald-600 font-bold mt-1">
                  ✓ Coupon applied: ₹{couponDiscount} preview discount (final amount confirmed at payment)
                </p>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold">₹{total}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount (Preview)</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Digital Delivery</span>
                <span className="font-bold text-emerald-600">FREE (Instant)</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                <span>Est. Total</span>
                <span>₹{previewFinalAmount}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Final amount confirmed by server at payment time.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Checkout;
