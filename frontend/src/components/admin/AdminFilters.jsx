import React from 'react';
import { Search, Filter, Trash2 } from 'lucide-react';
import { BOOK_CATEGORIES } from '../../constants/bookConstants';

const AdminFilters = ({
  search,
  setSearch,
  category,
  setCategory,
  stockStatus,
  setStockStatus,
  selectedCount,
  onBulkDelete,
}) => {
  return (
    <div className="bg-[#13161c] border border-gray-800 p-4 rounded-2xl space-y-3 sm:space-y-0 sm:flex items-center justify-between gap-4 shadow-lg">
      <div className="flex-1 flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-gray-800 text-white pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-gray-500 hidden sm:inline" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-black border border-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-bold"
          >
            {BOOK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
          className="bg-black border border-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-bold"
        >
          <option value="">All Stock Levels</option>
          <option value="in-stock">In Stock (&gt;5)</option>
          <option value="low-stock">Low Stock (1-5)</option>
          <option value="out-of-stock">Out of Stock (0)</option>
        </select>
      </div>

      {/* Bulk Delete Action */}
      {selectedCount > 0 && (
        <button
          onClick={onBulkDelete}
          className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <Trash2 size={14} />
          <span>Delete ({selectedCount})</span>
        </button>
      )}
    </div>
  );
};

export default AdminFilters;
