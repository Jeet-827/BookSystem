import React, { useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookById, clearCurrentBook } from '../store/slices/booksSlice';
import { addToCart } from '../store/slices/cartSlice';
import MoonLoader from '../components/MoonLoader';
import {
  Star,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowLeft,
  Download,
  FileCheck,
} from 'lucide-react';

const BookDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentBook: book, detailLoading: loading, error } = useSelector(
    (state) => state.books
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchBookById(id));
    }
    return () => {
      dispatch(clearCurrentBook());
    };
  }, [id, dispatch]);

  const handleAddToCart = useCallback(() => {
    if (book) {
      dispatch(addToCart(book));
    }
  }, [dispatch, book]);

  const handleBuyNow = useCallback(() => {
    if (book) {
      dispatch(addToCart(book));
      navigate('/cart');
    }
  }, [dispatch, book, navigate]);

  const handleDownloadFile = useCallback(() => {
    if (book?.downloadUrl) {
      window.open(book.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  }, [book?.downloadUrl]);

  const discount = useMemo(() => {
    if (book?.originalPrice && book?.originalPrice > book?.price) {
      return Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100);
    }
    return 0;
  }, [book?.originalPrice, book?.price]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28 text-center flex flex-col items-center justify-center">
        <MoonLoader size={54} color="#000000" text="Loading book specifications & details..." />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-4xl">❌</div>
        <h2 className="text-xl font-extrabold text-gray-900">Book Not Found</h2>
        <p className="text-xs text-gray-500">
          The book you are looking for does not exist or has been removed from our catalog.
        </p>
        <Link
          to="/books"
          className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Back to Books</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <Link to={`/books?category=${book.category}`} className="hover:text-black">
          {book.category}
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-900 truncate max-w-xs">{book.title}</span>
      </nav>

      {/* Main Detail Grid Layout */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cover & Sticky CTAs */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="bg-slate-100 p-8 rounded-xl border border-gray-100 flex items-center justify-center min-h-[340px] sm:min-h-[420px]">
            <img
              src={book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}
              alt={book.title}
              width={400}
              height={600}
              className="max-h-80 sm:max-h-96 w-auto object-cover rounded-md shadow-2xl"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              id="detail-add-to-cart-btn"
              className="flex items-center justify-center gap-2 border-2 border-black bg-white text-black py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-gray-100 active:scale-95 transition-all"
            >
              <ShoppingCart size={18} />
              <span>ADD TO CART</span>
            </button>
            <button
              onClick={handleBuyNow}
              id="detail-buy-now-btn"
              className="flex items-center justify-center gap-2 bg-black text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-gray-800 active:scale-95 transition-all shadow-md"
            >
              <Zap size={18} />
              <span>BUY NOW</span>
            </button>
          </div>

          {/* Digital Copy Direct Download Button */}
          {book.downloadUrl && (
            <button
              onClick={handleDownloadFile}
              className="w-full flex items-center justify-center gap-2 bg-[#0f1115] text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-gray-900 border border-gray-800 transition-all"
              title="Download sample PDF"
            >
              <Download size={16} className="text-amber-400" />
              <span>
                Download Sample {book.fileFormat || 'PDF'} ({book.fileSize || 'Sample'})
              </span>
            </button>
          )}

          {/* Assurance Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-2.5 text-xs text-gray-700">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>100% Genuine Physical Book Copy</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck size={16} className="text-blue-600" />
              <span>Express Delivery in 2-3 Days</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw size={16} className="text-black" />
              <span>7-Day Replacement & 1-Day Refund Guarantee</span>
            </div>
          </div>
        </div>

        {/* Right Column: Book Details & Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display leading-tight">
              {book.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Author: <strong className="text-gray-900">{book.author}</strong>
            </p>
          </div>

          {/* Ratings */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1 bg-black text-white text-xs font-extrabold px-2.5 py-1 rounded">
              <span>{book.rating || 4.5}</span>
              <Star size={12} className="fill-amber-400 stroke-amber-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {(book.reviewCount || 1240).toLocaleString()} Ratings & Reviews
            </span>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900 font-display">
                ₹{book.price}
              </span>
              {book.originalPrice > book.price && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ₹{book.originalPrice}
                  </span>
                  <span className="bg-emerald-600 text-white text-xs font-extrabold px-2 py-0.5 rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="text-xs font-bold">
              {book.stock > 0 ? (
                <span className="text-emerald-700">✔ In Stock ({book.stock} copies left)</span>
              ) : (
                <span className="text-red-600">✖ Currently Out of Stock</span>
              )}
            </div>
          </div>

          {/* Synopsis */}
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 font-display border-b border-gray-100 pb-1.5">
              Synopsis & Description
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {book.description}
            </p>
          </div>

          {/* Digital Copy Callout */}
          {book.downloadUrl && (
            <div className="bg-slate-50 border border-dashed border-gray-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileCheck size={26} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    Instant Digital Copy Included ({book.fileFormat || 'PDF'})
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Size: {book.fileSize || 'Standard'} • Unlocked on checkout
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadFile}
                className="bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center gap-1.5 flex-shrink-0"
              >
                <Download size={13} />
                <span>Sample PDF</span>
              </button>
            </div>
          )}

          {/* Specifications Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 font-display border-b border-gray-100 pb-1.5">
              Book Details & Specs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Language</span>
                <span className="text-xs font-bold text-gray-900">{book.language || 'English'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Category</span>
                <span className="text-xs font-bold text-gray-900">{book.category}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Pages</span>
                <span className="text-xs font-bold text-gray-900">{book.pages || 'N/A'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Publisher</span>
                <span className="text-xs font-bold text-gray-900">{book.publisher || 'Standard'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Year</span>
                <span className="text-xs font-bold text-gray-900">{book.publishedYear || 'N/A'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Binding</span>
                <span className="text-xs font-bold text-gray-900">Paperback</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
