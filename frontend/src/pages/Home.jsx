import React, { useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedBooks, fetchBestsellers, setFilter } from '../store/slices/booksSlice';
import BookCard from '../components/BookCard';
import MoonLoader from '../components/MoonLoader';
import { ArrowRight, Flame, Sparkles, BookCheck, Zap } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Fiction',
  'Self-Help',
  'Technology',
  'History',
  'Science',
  'Biography',
  'Non-Fiction',
];

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { featuredBooks, bestsellers, loading } = useSelector((state) => state.books);

  useEffect(() => {
    dispatch(fetchFeaturedBooks());
    dispatch(fetchBestsellers());
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
      {/* Category Strip - Flipkart Horizontal Scroll */}
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
      <section className="bg-gradient-to-br from-[#0d0f12] to-[#1a1e26] text-white py-12 md:py-20 border-b border-gray-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase text-amber-400">
                <Sparkles size={14} /> The Grand Book Carnival • Up to 50% Off
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight font-display">
                Feed Your Mind With{' '}
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Timeless Masterpieces
                </span>
                .
              </h1>

              <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Discover thousands of bestsellers, tech guides, and growth books with express doorstep delivery & instant digital PDF downloads.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/books"
                  id="hero-explore-btn"
                  className="inline-flex items-center gap-2 bg-white text-black font-extrabold px-6 py-3 rounded-lg text-sm hover:bg-gray-200 transition-all shadow-md active:scale-95"
                >
                  <span>Explore Books</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 border border-gray-600 text-white font-bold px-6 py-3 rounded-lg text-sm hover:bg-white/10 hover:border-white transition-all"
                >
                  <span>Join BookMart</span>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-800 text-center lg:text-left">
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white font-display">10,000+</h4>
                  <p className="text-xs text-gray-400">Curated Titles</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white font-display">4.8 / 5</h4>
                  <p className="text-xs text-gray-400">Reader Rating</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white font-display">Instant</h4>
                  <p className="text-xs text-gray-400">PDF Download</p>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Stack */}
            <div className="lg:col-span-5 hidden sm:flex justify-center items-center relative py-6">
              <div className="relative w-64 h-80">
                <div className="absolute top-0 left-0 w-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 -rotate-6 transition-transform hover:rotate-0 duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"
                    alt="Cover 1"
                    width={400}
                    height={533}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="absolute top-8 right-0 w-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 rotate-6 transition-transform hover:rotate-0 duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400"
                    alt="Cover 2"
                    width={400}
                    height={533}
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Deal Banner */}
        <div className="bg-black text-white rounded-xl p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md border border-gray-800">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="p-2 bg-amber-400 text-black rounded-lg">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold font-display">
                Deal of the Day: Flat 30% OFF on Bestselling Books + Free Shipping
              </h3>
              <p className="text-xs text-gray-400">
                Use code <strong>READMORE</strong> at checkout for free delivery on all orders.
              </p>
            </div>
          </div>
          <Link
            to="/books"
            className="bg-white text-black px-5 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold hover:bg-gray-200 transition-all flex-shrink-0"
          >
            Claim Deal
          </Link>
        </div>

        {/* Bestsellers Section */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Flame size={24} className="text-amber-500" />
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display">
                  Trending Bestsellers
                </h2>
                <p className="text-xs text-gray-500">Most purchased titles this week</p>
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
              <MoonLoader size={44} color="#000000" text="Loading trending bestsellers..." />
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
                  Editor's Choice Picks
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
