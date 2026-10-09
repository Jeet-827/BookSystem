import React, { useCallback, useMemo } from 'react';
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
} from '../store/slices/cartSlice';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Download,
  Sparkles,
  Lock,
  BookOpen,
} from 'lucide-react';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const total = useSelector(selectCartTotal);
  const discount = useSelector(selectCartDiscount);

  const handleCheckout = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }
    navigate('/checkout');
  }, [isAuthenticated, navigate]);

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

  // Empty Cart Screen
  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 font-display">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          Explore our collection of bestselling eBooks, guides, and masterclasses with instant offline downloads & 24-hour refund protection.
        </p>
        <Link
          to="/books"
          id="cart-empty-explore-btn"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95"
        >
          <span>Explore eBook Catalog</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // Active Cart Screen
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">
            Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'eBook' : 'eBooks'})
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Instant digital access & unlimited downloads unlocked immediately upon checkout.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <Sparkles size={15} className="text-emerald-600" />
          <span>Zero Shipping Fees • 100% Digital Download</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <section className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Selected Digital Editions
            </span>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"
            >
              Clear Cart
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {cartItems.map((item) => (
              <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                <Link to={`/books/${item._id}`} className="flex-shrink-0">
                  <img
                    src={
                      item.image ||
                      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
                    }
                    alt={item.title}
                    className="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-lg shadow-sm border border-gray-100"
                  />
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/books/${item._id}`}>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1 hover:text-black">
                          {item.title}
                        </h3>
                      </Link>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex-shrink-0">
                        {item.fileFormat || 'PDF'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">by {item.author}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-base font-extrabold text-gray-900">
                        ₹{item.price}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{item.originalPrice}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-gray-400">
                        • {item.fileSize || 'Standard eBook'}
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Delete Controls */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => handleUpdateQty(item._id, item.quantity - 1)}
                        className="p-1 sm:px-2 hover:bg-gray-200 text-gray-700 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item._id, item.quantity + 1)}
                        className="p-1 sm:px-2 hover:bg-gray-200 text-gray-700 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item._id)}
                      className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
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
        <aside className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <BookOpen size={18} className="text-gray-700" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 font-display">
              Order Summary
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-gray-600">
            <div className="flex justify-between">
              <span>List Price ({cartItems.length} items)</span>
              <span className="font-semibold text-gray-900">₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Instant Discount</span>
                <span className="font-semibold">- ₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Download size={14} className="text-gray-400" />
                Digital Delivery
              </span>
              <span className="text-emerald-600 font-extrabold text-xs bg-emerald-50 px-2 py-0.5 rounded">
                FREE (INSTANT)
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-baseline">
            <span className="text-sm font-extrabold text-gray-900">Total Due</span>
            <span className="text-2xl font-extrabold text-gray-900 font-display">₹{total}</span>
          </div>

          {discount > 0 && (
            <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg text-center">
              🎉 You are saving ₹{discount} on this digital order!
            </p>
          )}

          <button
            onClick={handleCheckout}
            id="cart-checkout-btn"
            className="w-full bg-black text-white py-3.5 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-gray-800 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            <span>{isAuthenticated ? 'PROCEED TO PAYMENT' : 'LOGIN TO CHECKOUT'}</span>
            <ArrowRight size={16} />
          </button>

          <div className="space-y-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
              <span>Instant Download & 24-Hour Refund Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 flex-shrink-0" />
              <span>DRM-Free offline reading on mobile, tablet & PC</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
