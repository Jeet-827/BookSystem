import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';

const Footer = memo(() => {
  return (
    <footer className="bg-[#0f1115] text-white border-t border-gray-800 mt-auto pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 border-b border-gray-800">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/5 rounded-lg border border-gray-800">
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">Free Fast Shipping</h5>
              <p className="text-xs text-gray-400">On all orders above ₹499</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/5 rounded-lg border border-gray-800">
              <ShieldCheck size={22} className="text-emerald-400" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">100% Genuine Books</h5>
              <p className="text-xs text-gray-400">Verified publishers</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/5 rounded-lg border border-gray-800">
              <RotateCcw size={22} className="text-amber-400" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">7-Day Replacement</h5>
              <p className="text-xs text-gray-400">Hassle-free return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/5 rounded-lg border border-gray-800">
              <Headphones size={22} className="text-blue-400" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">24/7 Reader Support</h5>
              <p className="text-xs text-gray-400">Instant expert assistance</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white text-black rounded">
                <BookOpen size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-extrabold font-display">BookMart</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Your ultimate online bookstore for trending bestsellers, timeless fiction, self-help, and academic books with instant digital downloads.
            </p>
          </div>

          {/* Popular Genres */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">
              Top Categories
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/books?category=Fiction" className="hover:text-white transition-colors">Fiction & Literature</Link></li>
              <li><Link to="/books?category=Self-Help" className="hover:text-white transition-colors">Self-Help & Mindset</Link></li>
              <li><Link to="/books?category=Technology" className="hover:text-white transition-colors">Technology & Coding</Link></li>
              <li><Link to="/books?category=History" className="hover:text-white transition-colors">History & Biographies</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/books" className="hover:text-white transition-colors">Browse Catalog</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Account Login</Link></li>
            </ul>
          </div>

          {/* Customer Help */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">
              Customer Help
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#help" className="hover:text-white transition-colors">Order Tracking</a></li>
              <li><a href="#shipping" className="hover:text-white transition-colors">Delivery Rates</a></li>
              <li><a href="#returns" className="hover:text-white transition-colors">Returns & Refunds</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <p>© {new Date().getFullYear()} BookMart, Inc. Powered by MERN Stack & Tailwind CSS.</p>
          <p>Black & White Flipkart-Inspired High Contrast Design</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
