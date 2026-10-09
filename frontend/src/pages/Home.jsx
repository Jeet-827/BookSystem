import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedBooks, fetchBestsellers, setFilter } from '../store/slices/booksSlice';
import api from '../api/axios';
import BookCard from '../components/BookCard';
import MoonLoader from '../components/MoonLoader';
import {
  ArrowRight,
  Flame,
  Sparkles,
  BookCheck,
  Zap,
  Download,
  WifiOff,
  ShieldCheck,
  Smartphone,
  BookOpen,
  Tag,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Fiction',
  'Self-Help',
  'Technology',
  'History',
  'Science',
  'Biography',
  'Non-Fiction',
  'Mystery',
  'Romance',
  'Children',
];

const THEME_MAP = {
  blue: {
    gradient: 'from-blue-950 via-indigo-950 to-slate-900',
    border: 'border-blue-900/40',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    btn: 'bg-blue-400 hover:bg-blue-300 text-black',
    accent: 'text-blue-300',
  },
  amber: {
    gradient: 'from-amber-950 via-orange-950 to-stone-900',
    border: 'border-amber-900/40',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    btn: 'bg-amber-400 hover:bg-amber-300 text-black',
    accent: 'text-amber-300',
  },
  violet: {
    gradient: 'from-purple-950 via-violet-950 to-slate-900',
    border: 'border-purple-900/40',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    btn: 'bg-purple-400 hover:bg-purple-300 text-black',
    accent: 'text-purple-300',
  },
  emerald: {
    gradient: 'from-emerald-950 via-teal-950 to-slate-900',
    border: 'border-emerald-900/40',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    btn: 'bg-emerald-400 hover:bg-emerald-300 text-black',
    accent: 'text-emerald-300',
  },
  rose: {
    gradient: 'from-rose-950 via-pink-950 to-slate-900',
    border: 'border-rose-900/40',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    btn: 'bg-rose-400 hover:bg-rose-300 text-black',
    accent: 'text-rose-300',
  },
  indigo: {
    gradient: 'from-indigo-950 via-blue-950 to-slate-900',
    border: 'border-indigo-900/40',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    btn: 'bg-white hover:bg-gray-100 text-black',
    accent: 'text-indigo-300',
  },
};

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { featuredBooks, bestsellers, loading } = useSelector((state) => state.books);
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    dispatch(fetchFeaturedBooks());
    dispatch(fetchBestsellers());

    api
      .get('/posters')
      .then((res) => {
        if (res.data?.posters?.length) {
          setPosters(res.data.posters);
        }
      })
      .catch((err) => {
        console.warn('Posters fallback active:', err.message);
      });
  }, [dispatch]);

  const handleCategoryClick = useCallback(
    (cat) => {
      dispatch(setFilter({ category: cat }));
      navigate(cat === 'All' ? '/books' : `/books?category=${cat}`);
    },
    [dispatch, navigate]
  );

  const categoryList = useMemo(() => CATEGORIES, []);

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Category Strip - Horizontal Scroll */}
      <nav className="bg-white border-b border-gray-200 py-3 shadow-sm sticky top-16 md:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {categoryList.map((cat) => (
              <li key={cat} className="flex-shrink-0">
                <button
                  onClick={() => handleCategoryClick(cat)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200 bg-slate-50 text-gray-800 hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all"
                >
                  {cat === 'All' ? '🌟 All Genres' : cat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0b0d10] via-[#14171d] to-[#1e232d] text-white py-12 md:py-20 border-b border-gray-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase text-amber-400">
                <Download size={14} /> Instant eBook Downloads • Offline Reading Platform
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight font-display">
                Feed Your Mind With{' '}
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Timeless Masterpieces
                </span>
                .
              </h1>

              <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Zero physical shipping waiting times. Pay securely and download high-resolution PDF & EPUB eBooks instantly to read offline on phone, tablet, Kindle, or laptop!
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/books"
                  id="hero-explore-btn"
                  className="inline-flex items-center gap-2 bg-white text-black font-extrabold px-6 py-3.5 rounded-xl text-sm hover:bg-gray-200 transition-all shadow-md active:scale-95"
                >
                  <Download size={18} className="text-black" />
                  <span>Explore & Download eBooks</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 border border-gray-600 text-white font-bold px-6 py-3.5 rounded-xl text-sm hover:bg-white/10 hover:border-white transition-all"
                >
                  <BookOpen size={18} />
                  <span>My Offline Library</span>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-800 text-center lg:text-left">
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white font-display">10,000+</h4>
                  <p className="text-xs text-gray-400">Digital Titles</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white font-display">Instant</h4>
                  <p className="text-xs text-gray-400">Download Upon Payment</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white font-display">100%</h4>
                  <p className="text-xs text-gray-400">Offline Compatible</p>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Stack */}
            <div className="lg:col-span-5 hidden sm:flex justify-center items-center relative py-6">
              <div className="relative w-64 h-80">
                <div className="absolute top-0 left-0 w-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 -rotate-6 transition-transform hover:rotate-0 duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"
                    alt="eBook Cover 1"
                    width={400}
                    height={533}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white px-2 py-0.5 rounded">
                    PDF eBook
                  </div>
                </div>
                <div className="absolute top-8 right-0 w-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 rotate-6 transition-transform hover:rotate-0 duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400"
                    alt="eBook Cover 2"
                    width={400}
                    height={533}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white px-2 py-0.5 rounded">
                    Offline Ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Value Proposition Posters Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-3.5">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl flex-shrink-0">
              <Download size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 font-display">Instant Download</h4>
              <p className="text-xs text-gray-500 mt-1">
                Receive download links within 2 seconds of payment confirmation.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl flex-shrink-0">
              <WifiOff size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 font-display">Offline Reading</h4>
              <p className="text-xs text-gray-500 mt-1">
                Read uninterrupted on planes, trains, or off-grid with no Wi-Fi needed.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl flex-shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 font-display">Zero Shipping Costs</h4>
              <p className="text-xs text-gray-500 mt-1">
                100% digital savings. No shipping fees, no wait times, ever.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-3.5">
            <div className="p-3 bg-violet-50 text-violet-700 rounded-xl flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 font-display">24-Hr Refund Guarantee</h4>
              <p className="text-xs text-gray-500 mt-1">
                Changed your mind? Request an instant full refund within 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* Promotional Poster Banners (from DB) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-black text-white rounded-lg">
                <Tag size={16} />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-display text-gray-900 tracking-tight">
                Featured Promotions & Banners
              </h2>
            </div>
            <Link
              to="/books"
              className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1 transition-colors"
            >
              <span>View All eBooks</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(posters.length > 0 ? posters : [
              {
                title: 'Master Full-Stack, AI & Cloud Computing',
                subtitle: 'Download interactive developer guides and read offline while building apps.',
                badge: 'Tech & Developer Edition',
                image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
                category: 'Technology',
                ctaText: 'Browse Tech eBooks',
                theme: 'blue',
                discountCode: 'TECH40',
                discountText: 'Flat 40% OFF',
              },
              {
                title: 'Transform Habits & Accelerate Wealth',
                subtitle: 'Practical frameworks for personal mastery, extreme focus, and financial independence.',
                badge: 'Mindset & Growth',
                image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800',
                category: 'Self-Help',
                ctaText: 'Read Self-Help Titles',
                theme: 'amber',
                discountCode: 'READMORE',
                discountText: 'Bestseller Picks',
              },
              {
                title: 'Timeless Classic Novels & Global Fiction',
                subtitle: 'DRM-free high-resolution PDF & EPUB literature ready for your e-reader or mobile device.',
                badge: 'Literary Classics',
                image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800',
                category: 'Fiction',
                ctaText: 'Explore Fiction Classics',
                theme: 'violet',
                discountCode: 'BOOK20',
                discountText: 'Zero Delivery Fees',
              },
            ]).map((poster, idx) => {
              const theme = THEME_MAP[poster.theme] || THEME_MAP.blue;
              return (
                <div
                  key={poster._id || idx}
                  className={`bg-gradient-to-br ${theme.gradient} text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg border ${theme.border} relative overflow-hidden group hover:shadow-xl transition-all duration-300`}
                >
                  {poster.image && (
                    <div className="absolute inset-0 opacity-15 group-hover:opacity-20 transition-opacity pointer-events-none">
                      <img
                        src={poster.image}
                        alt={poster.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="space-y-3 z-10 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${theme.badge}`}>
                        {poster.badge || 'Featured Deal'}
                      </span>
                      {poster.discountText && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-amber-300">
                          {poster.discountText}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold font-display leading-snug">
                      {poster.title}
                    </h3>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {poster.subtitle}
                    </p>
                  </div>
                  <div className="pt-6 z-10 relative flex items-center justify-between">
                    <button
                      onClick={() => handleCategoryClick(poster.category || 'All')}
                      className={`${theme.btn} font-extrabold px-4 py-2 rounded-xl text-xs transition-all inline-flex items-center gap-1.5 shadow active:scale-95`}
                    >
                      <span>{poster.ctaText || 'Explore eBooks'}</span>
                      <ArrowRight size={13} />
                    </button>
                    {poster.discountCode && (
                      <span className="text-[10px] font-mono text-gray-300">
                        Code: <strong className="text-white font-bold">{poster.discountCode}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Coupon Promo Banner */}
        <div className="bg-black text-white rounded-2xl p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-gray-800">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="p-3 bg-amber-400 text-black rounded-xl">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold font-display">
                Digital Launch Promo: Flat 20% OFF With Code <span className="text-amber-400 font-mono">READMORE</span>
              </h3>
              <p className="text-xs text-gray-400">
                Unlock instant PDF & EPUB downloads with simulated payment (Card, UPI, NetBanking, Wallet).
              </p>
            </div>
          </div>
          <Link
            to="/books"
            className="bg-white text-black px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-gray-200 transition-all flex-shrink-0 shadow active:scale-95"
          >
            Claim 20% Off
          </Link>
        </div>

        {/* Bestsellers Section */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Flame size={24} className="text-amber-500" />
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display">
                  Trending Digital Bestsellers
                </h2>
                <p className="text-xs text-gray-500">Most downloaded eBooks this week</p>
              </div>
            </div>
            <Link
              to="/books"
              className="text-xs sm:text-sm font-bold text-black hover:underline flex items-center gap-1"
            >
              View All &rarr;
            </Link>
          </div>

          {loading && bestsellers.length === 0 ? (
            <div className="py-12">
              <MoonLoader size={44} color="#000000" text="Loading trending eBooks..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestsellers.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* Editor's Choice Section */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <BookCheck size={24} className="text-black" />
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display">
                  Editor's Choice Digital Editions
                </h2>
                <p className="text-xs text-gray-500">Handpicked masterpieces across all categories</p>
              </div>
            </div>
            <Link
              to="/books"
              className="text-xs sm:text-sm font-bold text-black hover:underline flex items-center gap-1"
            >
              Browse All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredBooks.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
