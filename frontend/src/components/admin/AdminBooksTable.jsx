import React from 'react';
import { Edit2, Trash2, Star, Sparkles, Flame, Check, X } from 'lucide-react';

const AdminBooksTable = ({
  books,
  loading,
  selectedBookIds,
  onSelectAll,
  onSelectBook,
  onEditBook,
  onDeleteBook,
  onToggleFeatured,
  onToggleBestseller,
  onUpdateStock,
}) => {
  if (loading && books.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm font-bold animate-pulse">
        Loading inventory...
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500 text-sm font-bold bg-[#13161c] rounded-2xl border border-gray-800">
        No books found matching your filters.
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
              <th className="py-3 px-4">Stock</th>
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

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        defaultValue={book.stock}
                        onBlur={(e) => onUpdateStock(book._id, e.target.value)}
                        className={`w-16 bg-black border px-2 py-1 rounded font-bold text-xs focus:outline-none ${
                          book.stock === 0
                            ? 'border-red-500 text-red-400'
                            : book.stock <= 5
                            ? 'border-amber-500 text-amber-400'
                            : 'border-gray-700 text-emerald-400'
                        }`}
                      />
                    </div>
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
