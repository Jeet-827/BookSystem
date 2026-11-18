import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Download, RotateCcw, Headphones, Zap } from 'lucide-react';

const Footer = memo(() => {
  return (
    <footer className="bg-[#0f1115] text-white border-t border-gray-800 mt-auto pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges - 100% Online Digital Delivery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 border-b border-gray-800">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/5 rounded-lg border border-gray-800">
              <Download size={22} className="text-amber-400" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">Instant Digital Delivery</h5>
              <p className="text-xs text-gray-400">Download eBooks immediately online</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/5 rounded-lg border border-gray-800">
              <ShieldCheck size={22} className="text-emerald-400" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">100% Genuine eBooks</h5>
              <p className="text-xs text-gray-400">Universal PDF &amp; EPUB formats</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/5 rounded-lg border border-gray-800">
              <RotateCcw size={22} className="text-amber-400" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">24-Hour Refund Policy</h5>
              <p className="text-xs text-gray-400">Guaranteed reader satisfaction</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/5 rounded-lg border border-gray-800">
              <Headphones size={22} className="text-blue-400" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">24/7 Digital Support</h5>
              <p className="text-xs text-gray-400">Read on Phone, Tablet &amp; PC</p>
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
              <h3 className="text-xl font-extrabold font-display">redkitindia</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Your premier online digital bookstore. Instant download eBooks, guides, and tech manuals without waiting for shipping.
            </p>
          </div>

          {/* Popular Genres */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">
              Top Categories
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/books?category=Fiction" className="hover:text-white transition-colors">Fiction &amp; Literature</Link></li>
              <li><Link to="/books?category=Self-Help" className="hover:text-white transition-colors">Self-Help &amp; Mindset</Link></li>
              <li><Link to="/books?category=Technology" className="hover:text-white transition-colors">Technology &amp; Coding</Link></li>
              <li><Link to="/books?category=History" className="hover:text-white transition-colors">History &amp; Biographies</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/books" className="hover:text-white transition-colors">Browse Digital Catalog</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">My Digital Library</Link></li>
            </ul>
          </div>

          {/* Customer Help */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">
              Support &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/orders" className="hover:text-white transition-colors">Instant eBook Access</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">24-Hour Refunds</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><span className="text-gray-500">Offline Reading Compatible</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <p>© {new Date().getFullYear()} redkitindia, Inc. Instant digital downloads.</p>
          <p>Secure Razorpay Checkout • Google Drive Cloud Downloads • ImageKit CDN</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
