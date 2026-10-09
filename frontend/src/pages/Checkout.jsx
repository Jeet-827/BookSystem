import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectCartSubtotal, selectCartTotal, selectCartDiscount, clearCart } from '../store/slices/cartSlice';
import { placeOrder, clearOrderState } from '../store/slices/ordersSlice';
import {
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
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
  BookOpen,
  Receipt,
  Eye,
  EyeOff,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { id: 'upi', label: 'UPI', icon: Smartphone, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
];

const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Yes Bank'];
const WALLETS = ['BookMart Wallet', 'Paytm', 'PhonePe', 'Amazon Pay', 'Freecharge'];

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { placingOrder, lastPlacedOrder, error } = useSelector((state) => state.orders);

  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const total = useSelector(selectCartTotal);
  const discount = useSelector(selectCartDiscount);

  const [step, setStep] = useState('payment'); // 'payment' | 'processing' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);

  // UPI
  const [upiId, setUpiId] = useState('');

  // Net Banking
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Wallet
  const [selectedWallet, setSelectedWallet] = useState('BookMart Wallet');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    }
  }, [isAuthenticated, navigate]);

  // Redirect if cart empty and not in success state
  useEffect(() => {
    if (cartItems.length === 0 && step !== 'success') {
      navigate('/cart');
    }
  }, [cartItems.length, step, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearOrderState());
    };
  }, [dispatch]);

  // Handle order success
  useEffect(() => {
    if (lastPlacedOrder && step === 'processing') {
      setTimeout(() => {
        setStep('success');
        dispatch(clearCart());
      }, 2200);
    }
  }, [lastPlacedOrder, step, dispatch]);

  const applyCoupon = useCallback(() => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'READMORE') {
      setCouponDiscount(Math.round(total * 0.1));
      setCouponApplied(true);
    } else if (code === 'FIRST50') {
      setCouponDiscount(Math.round(total * 0.5));
      setCouponApplied(true);
    } else if (code === 'BOOK20') {
      setCouponDiscount(Math.round(total * 0.2));
      setCouponApplied(true);
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
    }
  }, [couponCode, total]);

  const finalAmount = useMemo(() => Math.max(0, total - couponDiscount), [total, couponDiscount]);

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  // Format expiry
  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) return v.substring(0, 2) + '/' + v.substring(2);
    return v;
  };

  const isPaymentValid = useMemo(() => {
    if (paymentMethod === 'card') {
      return cardNumber.replace(/\s/g, '').length >= 13 && cardName.trim().length >= 2 && cardExpiry.length >= 4 && cardCvv.length >= 3;
    }
    if (paymentMethod === 'upi') {
      return upiId.includes('@') && upiId.length >= 5;
    }
    return true;
  }, [paymentMethod, cardNumber, cardName, cardExpiry, cardCvv, upiId]);

  const handlePayment = useCallback(() => {
    if (!isPaymentValid) return;

    setStep('processing');

    const paymentDetails = {};
    if (paymentMethod === 'card') {
      paymentDetails.cardNumber = cardNumber.replace(/\s/g, '');
      paymentDetails.cardName = cardName;
      paymentDetails.cardExpiry = cardExpiry;
    } else if (paymentMethod === 'upi') {
      paymentDetails.upiId = upiId;
    } else if (paymentMethod === 'netbanking') {
      paymentDetails.bankName = selectedBank;
    } else if (paymentMethod === 'wallet') {
      paymentDetails.walletProvider = selectedWallet;
    }

    dispatch(
      placeOrder({
        items: cartItems,
        paymentMethod,
        paymentDetails,
        couponCode: couponApplied ? couponCode.trim().toUpperCase() : '',
      })
    );
  }, [isPaymentValid, paymentMethod, cardNumber, cardName, cardExpiry, upiId, selectedBank, selectedWallet, cartItems, couponApplied, couponCode, dispatch]);

  const handleDownload = useCallback((url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleDownloadAll = useCallback(() => {
    if (!lastPlacedOrder?.items) return;
    lastPlacedOrder.items.forEach((item, index) => {
      const url = item.digitalFileKey || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      }, index * 400);
    });
  }, [lastPlacedOrder]);

  // =========== PAYMENT PROCESSING SCREEN ===========
  if (step === 'processing') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 shadow-lg text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-black animate-spin"></div>
            <Lock size={28} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-900" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-gray-900 font-display">Processing Payment</h2>
            <p className="text-xs text-gray-500">
              Securely processing your ₹{finalAmount.toLocaleString('en-IN')} payment via {paymentMethod === 'card' ? 'Card' : paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'netbanking' ? 'Net Banking' : 'Wallet'}...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <Lock size={12} />
            <span>256-bit SSL Encrypted • PCI DSS Compliant</span>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700 font-medium">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
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
              Payment Successful!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
              Your ebooks are ready for <strong className="text-black">instant download</strong>. No shipping required — enjoy your digital library immediately.
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
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Amount Paid</span>
              <span className="font-extrabold text-gray-900">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-bold uppercase text-[10px]">Payment</span>
              <span className="font-bold text-emerald-700 capitalize">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-xl flex items-center justify-center gap-2 font-medium">
            <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
            <span>Transaction ID: <strong>{order.transactionId}</strong> • Protected by 1-Day Instant Refund</span>
          </div>

          {/* Downloads Section */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 sm:p-6 text-left space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 font-display">
                  Your Digital Library ({order.items?.length} {order.items?.length === 1 ? 'ebook' : 'ebooks'})
                </h3>
              </div>

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

            <div className="space-y-3">
              {order.items?.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-3.5 rounded-lg border border-gray-200 flex items-center justify-between flex-wrap gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 rounded overflow-hidden shadow-sm flex-shrink-0 bg-gray-100">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">{item.title}</h4>
                      <p className="text-[11px] text-gray-500">
                        by {item.author} • <strong className="text-black">{item.fileFormat || 'PDF'}</strong> ({item.fileSize || '~4 MB'})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(item.digitalFileKey || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')}
                    className="bg-gradient-to-r from-gray-900 to-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:from-black hover:to-gray-800 flex items-center gap-1.5 ml-auto sm:ml-0 transition-all active:scale-95 shadow-sm"
                  >
                    <Download size={14} className="text-amber-400" />
                    <span>Download {item.fileFormat || 'PDF'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 shadow transition-all active:scale-95"
            >
              <Package size={16} />
              <span>My Library & Orders</span>
            </Link>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 border border-black bg-white text-black px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========== PAYMENT FORM SCREEN ===========
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link to="/cart" className="hover:text-black flex items-center gap-1">
          <ArrowLeft size={14} />
          <span>Back to Cart</span>
        </Link>
        <span>•</span>
        <span className="font-bold text-black">Secure Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Payment Form */}
        <section className="lg:col-span-7 space-y-5">
          {/* Payment Method Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
              <Lock size={18} className="text-gray-700" />
              <h2 className="text-lg font-extrabold text-gray-900 font-display">Payment Method</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                    paymentMethod === m.id
                      ? `${m.bg} ring-2 ring-offset-1 ring-gray-900`
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <m.icon size={22} className={`mx-auto mb-1.5 ${paymentMethod === m.id ? m.color : 'text-gray-400'}`} />
                  <span className={`text-[10px] sm:text-xs font-bold ${paymentMethod === m.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    {m.label}
                  </span>
                  {paymentMethod === m.id && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details Form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 font-display pb-2 border-b border-gray-100">
              {paymentMethod === 'card' ? 'Card Details' : paymentMethod === 'upi' ? 'UPI Details' : paymentMethod === 'netbanking' ? 'Select Bank' : 'Select Wallet'}
            </h3>

            {/* CARD FORM */}
            {paymentMethod === 'card' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-slate-50"
                    />
                    <CreditCard size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Use 4242 4242 4242 4242 for demo</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">CVV</label>
                    <div className="relative">
                      <input
                        type={showCvv ? 'text' : 'password'}
                        inputMode="numeric"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-slate-50"
                      />
                      <button onClick={() => setShowCvv(!showCvv)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showCvv ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UPI FORM */}
            {paymentMethod === 'upi' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-slate-50"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Enter any valid UPI ID like user@paytm, user@oksbi</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                    <button
                      key={app}
                      onClick={() => setUpiId(`demo@${app.toLowerCase().replace(/\s/g, '')}`)}
                      className="p-2 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* NET BANKING */}
            {paymentMethod === 'netbanking' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-600 mb-1">Select Your Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map((bank) => (
                    <button
                      key={bank}
                      onClick={() => setSelectedBank(bank)}
                      className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${
                        selectedBank === bank
                          ? 'border-black bg-gray-50 text-black'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Landmark size={14} className={`mb-1 ${selectedBank === bank ? 'text-black' : 'text-gray-400'}`} />
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* WALLET */}
            {paymentMethod === 'wallet' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-600 mb-1">Select Wallet</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WALLETS.map((wallet) => (
                    <button
                      key={wallet}
                      onClick={() => setSelectedWallet(wallet)}
                      className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${
                        selectedWallet === wallet
                          ? 'border-black bg-gray-50 text-black'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Wallet size={14} className={`mb-1 ${selectedWallet === wallet ? 'text-amber-600' : 'text-gray-400'}`} />
                      {wallet}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coupon Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-gray-900 font-display">Have a Coupon?</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value); setCouponApplied(false); setCouponDiscount(0); }}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black bg-slate-50"
              />
              <button
                onClick={applyCoupon}
                className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all active:scale-95"
              >
                Apply
              </button>
            </div>
            {couponApplied && (
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={14} /> Coupon applied! You save ₹{couponDiscount.toLocaleString('en-IN')}
              </p>
            )}
            <p className="text-[10px] text-gray-400">Try: READMORE (10% off), BOOK20 (20% off), FIRST50 (50% off)</p>
          </div>
        </section>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 font-display border-b border-gray-200 pb-3">
              Order Summary
            </h3>

            {/* Items List */}
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item._id} className="py-2.5 flex items-center gap-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}
                    alt={item.title}
                    className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{item.title}</h4>
                    <p className="text-[10px] text-gray-500">
                      {item.fileFormat || 'PDF'} • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-gray-900 flex-shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex justify-between">
                <span>Price ({cartItems.length} items)</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Book Discount</span>
                  <span className="font-semibold">- ₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {couponApplied && couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon ({couponCode.toUpperCase()})</span>
                  <span className="font-semibold">- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-600">
                <span>Delivery</span>
                <span className="font-bold">FREE (Digital)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-gray-900">Total Payable</span>
              <span className="text-xl font-extrabold text-gray-900 font-display">₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>

            {discount + couponDiscount > 0 && (
              <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded text-center">
                You're saving ₹{(discount + couponDiscount).toLocaleString('en-IN')} on this order!
              </p>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!isPaymentValid || placingOrder}
              id="pay-now-btn"
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2 ${
                isPaymentValid && !placingOrder
                  ? 'bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-800 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {placingOrder ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>PAY ₹{finalAmount.toLocaleString('en-IN')} & GET INSTANT DOWNLOADS</span>
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <ShieldCheck size={15} className="text-emerald-600 flex-shrink-0" />
                <span>1-Day Instant Refund Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Lock size={15} className="text-blue-600 flex-shrink-0" />
                <span>Bank-grade 256-bit SSL encryption</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <BookOpen size={15} className="text-amber-600 flex-shrink-0" />
                <span>Instant ebook downloads after payment</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
