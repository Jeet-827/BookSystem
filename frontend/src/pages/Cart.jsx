import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartTotal,
  selectCartDiscount,
  updateQuantity,
  removeFromCart,
  clearCart,
  placeOrder,
} from '../store/slices/cartSlice';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Download,
  Sparkles,
  Package,
} from 'lucide-react';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const total = useSelector(selectCartTotal);
  const discount = useSelector(selectCartDiscount);

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [completedOrderItems, setCompletedOrderItems] = useState([]);

  const deliveryCharge = useMemo(
    () => (total > 499 || total === 0 ? 0 : 40),
    [total]
  );
  const finalAmount = useMemo(
    () => total + deliveryCharge,
    [total, deliveryCharge]
  );

  const handleCheckout = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=cart');
      return;
    }
    setCompletedOrderItems([...cartItems]);
    dispatch(
      placeOrder({
        items: cartItems,
        totalAmount: finalAmount,
        deliveryCharge,
      })
    );
    setOrderPlaced(true);
  }, [isAuthenticated, navigate, cartItems, dispatch, finalAmount, deliveryCharge]);

  const handleDownloadFile = useCallback((url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleDownloadAll = useCallback(() => {
    completedOrderItems.forEach((item, index) => {
      if (item.downloadUrl) {
        setTimeout(() => {
          window.open(item.downloadUrl, '_blank', 'noopener,noreferrer');
        }, index * 300);
      }
    });
  }, [completedOrderItems]);

  const handleUpdateQty = useCallback(
    (id, quantity) => {
      dispatch(updateQuantity({ id, quantity }));
    },
    [dispatch]
  );

  const handleRemove = useCallback(
    (id) => {
      dispatch(removeFromCart(id));
    },
    [dispatch]
  );

  const handleClear = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  // Order Success & Instant Downloads Delivery Screen
  if (orderPlaced) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm text-center space-y-6">
          <CheckCircle2 size={56} className="text-emerald-500 mx-auto" />
          
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">
              Order Placed Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
              Your physical book copies are confirmed for shipping, and your{' '}
              <strong className="text-black">instant digital copies (PDF / eBook)</strong> are available below.
            </p>
          </div>

          {/* 1-Day Refund Guarantee Note */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-xl flex items-center justify-center gap-2 font-medium">
            <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
            <span>Protected by 1-Day Instant Refund Guarantee. Return or cancel anytime within 24 hours.</span>
          </div>

          {/* Digital Downloads List */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 sm:p-6 text-left space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 font-display">
                  Digital Downloads ({completedOrderItems.length})
                </h3>
              </div>

              {completedOrderItems.length > 1 && (
                <button
                  onClick={handleDownloadAll}
                  className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download All</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {completedOrderItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-3.5 rounded-lg border border-gray-200 flex items-center justify-between flex-wrap gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded shadow-sm"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        by {item.author} • <strong className="text-black">{item.fileFormat || 'PDF'}</strong> ({item.fileSize || 'Standard'})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadFile(item.downloadUrl)}
                    className="bg-black text-white px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center gap-1.5 ml-auto sm:ml-0"
                  >
                    <Download size={14} className="text-amber-400" />
                    <span>Download {item.fileFormat || 'PDF'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 shadow"
            >
              <Package size={16} />
              <span>View My Orders & Manage Refunds</span>
            </Link>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 border border-black bg-white text-black px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-100"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty Cart Screen
  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag size={56} className="text-gray-400 mx-auto" />
        <h2 className="text-2xl font-extrabold text-gray-900 font-display">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Explore our collection of bestselling fiction, technology, and growth guides.
        </p>
        <Link
          to="/books"
          id="cart-empty-explore-btn"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-xs font-bold hover:bg-gray-800"
        >
          <span>Explore Catalog</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // Active Cart Screen
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cart Items List */}
        <section className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 font-display">
              Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </h2>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-gray-500 hover:text-red-600"
            >
              Clear Cart
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {cartItems.map((item) => (
              <div key={item._id} className="py-4 flex gap-3 sm:gap-4">
                <Link to={`/books/${item._id}`} className="flex-shrink-0">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}
                    alt={item.title}
                    className="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded shadow-sm"
                  />
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/books/${item._id}`}>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1 hover:text-black">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500">by {item.author}</p>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-extrabold text-gray-900">
                        ₹{item.price}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Delete Controls */}
                  <div className="flex items-center gap-4 mt-3 pt-2">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleUpdateQty(item._id, item.quantity - 1)}
                        className="p-1 sm:px-2 bg-gray-50 hover:bg-gray-100 text-gray-700"
                        aria-label="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item._id, item.quantity + 1)}
                        className="p-1 sm:px-2 bg-gray-50 hover:bg-gray-100 text-gray-700"
                        aria-label="Increase"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item._id)}
                      className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Order Summary Box */}
        <aside className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 lg:sticky lg:top-24">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 font-display border-b border-gray-200 pb-3">
            Price Details
          </h3>

          <div className="space-y-2.5 text-xs sm:text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Price ({cartItems.length} items)</span>
              <span className="font-semibold text-gray-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span className="font-semibold">- ₹{discount}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className="font-semibold text-gray-900">
                {deliveryCharge === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  `₹${deliveryCharge}`
                )}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-baseline">
            <span className="text-sm font-extrabold text-gray-900">Total Amount</span>
            <span className="text-xl font-extrabold text-gray-900 font-display">₹{finalAmount}</span>
          </div>

          <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded text-center">
            You will save ₹{discount} on this order!
          </p>

          <button
            onClick={handleCheckout}
            id="checkout-btn"
            className="w-full bg-black text-white py-3 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-gray-800 active:scale-95 transition-all shadow-md"
          >
            {isAuthenticated ? 'PLACE ORDER & UNLOCK DOWNLOADS' : 'LOGIN TO ORDER'}
          </button>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-2">
            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
            <span>1-Day Return & Instant Refund Guarantee</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
