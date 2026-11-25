import React from 'react';
import { Edit2, Trash2, Sparkles, Flame, AlertCircle, RefreshCw, BookOpen, PlusCircle } from 'lucide-react';

const AdminBooksTable = ({
  books,
  loading,
  error,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  onAddBook,
  selectedBookIds,
  onSelectAll,
  onSelectBook,
  onEditBook,
  onDeleteBook,
  onToggleFeatured,
  onToggleBestseller,
}) => {
  if (loading && books.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm font-bold animate-pulse bg-[#13161c] rounded-2xl border border-gray-800">
        Loading inventory...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-6 text-center bg-red-500/5 rounded-2xl border border-red-500/30 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-sm font-extrabold text-white">Failed to Load Books</h3>
          <p className="text-xs text-red-300 leading-relaxed">{error}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-bold transition-all"
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="py-14 px-6 text-center bg-[#13161c] rounded-2xl border border-gray-800 space-y-3">
        <div className="w-12 h-12 rounded-full bg-white/5 text-gray-400 flex items-center justify-center mx-auto">
          <BookOpen size={22} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-white">
            {hasActiveFilters ? 'No books match your filters' : 'No books in catalog yet'}
          </h3>
          <p className="text-xs text-gray-500">
            {hasActiveFilters
              ? 'Try clearing your search query or switching category.'
              : 'Add your first digital eBook to start selling.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-bold transition-all"
            >
              Clear Filters
            </button>
          )}
          {onAddBook && (
            <button
              type="button"
              onClick={onAddBook}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-all"
            >
              <PlusCircle size={14} />
              <span>Add New Book</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const allSelected = books.length > 0 && books.every((b) => selectedBookIds.includes(b._id));

  return (
    <div className="bg-[#13161c] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-white/5 border-b border-gray-800 uppercase font-extrabold text-[10px] tracking-wider text-gray-400">
            <tr>
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-gray-700 bg-gray-900 accent-amber-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Book Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Format</th>
              <th className="py-3 px-4 text-center">Badges</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {books.map((book) => {
              const isChecked = selectedBookIds.includes(book._id);
              return (
                <tr
                  key={book._id}
                  className={`hover:bg-white/5 transition-colors ${
                    isChecked ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onSelectBook(book._id)}
                      className="rounded border-gray-700 bg-gray-900 accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={
                        book.image ||
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={book.title}
                      className="w-9 h-12 object-cover rounded shadow bg-gray-800 flex-shrink-0"
                    />
                    <div className="min-w-0 max-w-xs">
                      <h4 className="font-bold text-white text-xs sm:text-sm truncate" title={book.title}>
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate">by {book.author}</p>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                      {book.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-extrabold text-white">
                    ₹{book.price}
                    {book.originalPrice > book.price && (
                      <span className="text-[10px] text-gray-500 line-through ml-1 font-normal">
                        ₹{book.originalPrice}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-xs text-gray-300">
                    <span className="font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">
                      {book.fileFormat || 'PDF'}
                    </span>
                    <span className="text-gray-500 text-[10px] block mt-0.5">
                      {book.fileSize || '3.5 MB'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onToggleFeatured(book._id)}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                          book.isFeatured
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-white/5 text-gray-500 border-white/10 opacity-50 hover:opacity-100'
                        }`}
                        title="Toggle Featured"
                      >
                        <Sparkles size={12} />
                      </button>

                      <button
                        onClick={() => onToggleBestseller(book._id)}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                          book.isBestseller
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-white/5 text-gray-500 border-white/10 opacity-50 hover:opacity-100'
                        }`}
                        title="Toggle Bestseller"
                      >
                        <Flame size={12} />
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEditBook(book)}
                        className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
                        title="Edit Book"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => onDeleteBook(book)}
                        className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                        title="Delete Book"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBooksTable;
