import React, { memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { Star, ShoppingCart, Download } from 'lucide-react';

const BookCard = memo(({ book }) => {
  const dispatch = useDispatch();

  const handleAddToCart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(addToCart(book));
    },
    [dispatch, book]
  );

  const discount = useMemo(() => {
    if (book.originalPrice && book.originalPrice > book.price) {
      return Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100);
    }
    return 0;
  }, [book.originalPrice, book.price]);

  return (
    <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-gray-300">
      <Link
        to={`/books/${book._id}`}
        className="flex flex-col flex-1"
      >
        {/* Book Cover Container */}
        <div className="relative bg-slate-100 p-4 h-56 sm:h-64 flex items-center justify-center overflow-hidden">
          {book.isBestseller && (
            <span className="absolute top-2.5 left-2.5 bg-black text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow z-10 tracking-wider">
              Bestseller
            </span>
          )}

          {discount > 0 && (
            <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded shadow z-10">
              {discount}% OFF
            </span>
          )}

          <img
            src={book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}
            alt={book.title}
            width={400}
            height={600}
            className="max-h-full max-w-full object-cover rounded shadow-md group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
            }}
          />
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
              {book.category}
            </span>
            {book.downloadUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                <Download size={10} /> {book.fileFormat || 'PDF'}
              </span>
            )}
          </div>

          <h3
            className="font-bold text-sm sm:text-base text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-black transition-colors"
            title={book.title}
          >
            {book.title}
          </h3>

          <p className="text-xs text-gray-500 truncate mb-2.5">
            by {book.author}
          </p>

          {/* Rating Badge */}
          <div className="inline-flex items-center gap-1 bg-black text-white text-xs font-bold px-2 py-0.5 rounded w-fit mb-3">
            <span>{book.rating || 4.5}</span>
            <Star size={11} className="fill-amber-400 stroke-amber-400" />
            <span className="opacity-70 text-[10px]">
              ({(book.reviewCount || 100).toLocaleString()})
            </span>
          </div>

          {/* Pricing */}
          <div className="mt-auto flex items-baseline gap-2 pt-2 border-t border-gray-100">
            <span className="text-lg font-extrabold text-gray-900">
              ₹{book.price}
            </span>
            {book.originalPrice > book.price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{book.originalPrice}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action Button */}
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-0">
        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-3 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-800 active:scale-95 transition-all shadow-sm"
          id={`add-cart-btn-${book._id}`}
        >
          <ShoppingCart size={15} />
          <span>Add to Cart</span>
        </button>
      </div>
    </article>
  );
});

BookCard.displayName = 'BookCard';

export default BookCard;
