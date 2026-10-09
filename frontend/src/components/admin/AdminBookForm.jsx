import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Image, FileText } from 'lucide-react';
import { BOOK_CATEGORIES, FILE_FORMATS } from '../../constants/bookConstants';

const AdminBookForm = ({ book, isOpen, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Fiction',
    price: '',
    originalPrice: '',
    stock: 10,
    image: '',
    downloadUrl: '',
    fileFormat: 'PDF',
    fileSize: '4.2 MB',
    description: '',
    isFeatured: false,
    isBestseller: false,
  });

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        category: book.category || 'Fiction',
        price: book.price || '',
        originalPrice: book.originalPrice || '',
        stock: book.stock !== undefined ? book.stock : 10,
        image: book.image || '',
        downloadUrl: book.downloadUrl || '',
        fileFormat: book.fileFormat || 'PDF',
        fileSize: book.fileSize || '4.2 MB',
        description: book.description || '',
        isFeatured: Boolean(book.isFeatured),
        isBestseller: Boolean(book.isBestseller),
      });
    } else {
      setFormData({
        title: '',
        author: '',
        category: 'Fiction',
        price: '',
        originalPrice: '',
        stock: 10,
        image: '',
        downloadUrl: '',
        fileFormat: 'PDF',
        fileSize: '4.2 MB',
        description: '',
        isFeatured: false,
        isBestseller: false,
      });
    }
  }, [book, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const categories = BOOK_CATEGORIES.filter((c) => c !== 'All');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#13161c] border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-white my-8">
        <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-extrabold font-display">
            {book ? 'Edit Book Details' : 'Add New Book to Inventory'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Book Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Author Name *</label>
              <input
                type="text"
                name="author"
                required
                value={formData.author}
                onChange={handleChange}
                className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Price (₹) *</label>
              <input
                type="number"
                name="price"
                required
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Original Price (₹) *</label>
              <input
                type="number"
                name="originalPrice"
                required
                min="0"
                value={formData.originalPrice}
                onChange={handleChange}
                className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Stock Count *</label>
              <input
                type="number"
                name="stock"
                required
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">File Format</label>
              <select
                name="fileFormat"
                value={formData.fileFormat}
                onChange={handleChange}
                className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {FILE_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">File Size</label>
              <input
                type="text"
                name="fileSize"
                value={formData.fileSize}
                onChange={handleChange}
                className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Cover Image URL</label>
            <input
              type="url"
              name="image"
              placeholder="https://..."
              value={formData.image}
              onChange={handleChange}
              className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Digital Download File URL</label>
            <input
              type="url"
              name="downloadUrl"
              placeholder="https://..."
              value={formData.downloadUrl}
              onChange={handleChange}
              className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Book Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="accent-amber-500 w-4 h-4 rounded"
              />
              <span>Featured Book</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                name="isBestseller"
                checked={formData.isBestseller}
                onChange={handleChange}
                className="accent-amber-500 w-4 h-4 rounded"
              />
              <span>Bestseller</span>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold rounded-xl text-xs hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : book ? 'Update Book' : 'Create Book'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBookForm;
