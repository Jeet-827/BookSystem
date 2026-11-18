import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  HardDrive,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';
import api from '../../api/api';
import { BOOK_CATEGORIES, FILE_FORMATS } from '../../constants/bookConstants';

const AdminBookForm = ({ book, isOpen, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Fiction',
    price: '',
    originalPrice: '',
    image: '',
    downloadUrl: '',
    fileFormat: 'PDF',
    fileSize: '4.2 MB',
    description: '',
    isFeatured: false,
    isBestseller: false,
  });

  // Upload States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [showManualImageUrl, setShowManualImageUrl] = useState(false);

  const [uploadingDriveFile, setUploadingDriveFile] = useState(false);
  const [driveUploadError, setDriveUploadError] = useState('');
  const [showManualDownloadUrl, setShowManualDownloadUrl] = useState(false);

  // Google Drive Connection Status
  const [driveStatus, setDriveStatus] = useState({ isConnected: false, connectedEmail: '' });
  const [checkingDrive, setCheckingDrive] = useState(false);
  const [authorizingDrive, setAuthorizingDrive] = useState(false);

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check Google Drive Status
  const checkDriveConnection = async () => {
    setCheckingDrive(true);
    try {
      const res = await api.get('/admin/drive/status');
      if (res.data?.success) {
        setDriveStatus({
          isConnected: Boolean(res.data.isConnected),
          connectedEmail: res.data.connectedEmail || '',
        });
      }
    } catch (err) {
      console.warn('Could not check Google Drive status:', err);
    } finally {
      setCheckingDrive(false);
    }
  };

  // Launch Google OAuth
  const handleConnectDrive = async () => {
    setAuthorizingDrive(true);
    setDriveUploadError('');
    try {
      const res = await api.get('/admin/drive/auth-url');
      if (res.data?.authUrl) {
        // Open OAuth in a popup or new tab
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        window.open(
          res.data.authUrl,
          'GoogleDriveAuth',
          `width=${width},height=${height},top=${top},left=${left}`
        );
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err) {
      setDriveUploadError(
        err.response?.data?.message || 'Failed to initiate Google Drive connection'
      );
    } finally {
      setAuthorizingDrive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkDriveConnection();
      setImageUploadError('');
      setDriveUploadError('');
      setShowManualImageUrl(false);
      setShowManualDownloadUrl(false);

      if (book) {
        setFormData({
          title: book.title || '',
          author: book.author || '',
          category: book.category || 'Fiction',
          price: book.price || '',
          originalPrice: book.originalPrice || '',
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
          image: '',
          downloadUrl: '',
          fileFormat: 'PDF',
          fileSize: '4.2 MB',
          description: '',
          isFeatured: false,
          isBestseller: false,
        });
      }
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

  // Convert File to Base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // Handle ImageKit Upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setImageUploadError('Image size exceeds 15 MB limit.');
      return;
    }

    setImageUploadError('');
    setUploadingImage(true);

    try {
      const base64Data = await fileToBase64(file);
      const res = await api.post('/admin/upload/image', {
        image: base64Data,
        fileName: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        folder: '/bookmart/books',
      });

      if (res.data?.success && res.data?.url) {
        setFormData((prev) => ({
          ...prev,
          image: res.data.url,
        }));
      } else {
        throw new Error(res.data?.message || 'Failed to upload cover image');
      }
    } catch (err) {
      console.error('ImageKit upload error:', err);
      setImageUploadError(
        err.response?.data?.message || err.message || 'ImageKit upload failed'
      );
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Handle Google Drive eBook File Upload
  const handleDriveFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect format
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const validFormats = ['PDF', 'EPUB', 'MOBI', 'AZW3', 'ZIP'];
    const detectedFormat = validFormats.includes(ext) ? ext : 'PDF';

    // Format readable size
    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize =
      sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;

    if (file.size > 50 * 1024 * 1024) {
      setDriveUploadError('File exceeds maximum upload limit of 50 MB.');
      return;
    }

    setDriveUploadError('');
    setUploadingDriveFile(true);

    try {
      const base64Data = await fileToBase64(file);
      const res = await api.post('/admin/upload/drive-file', {
        file: base64Data,
        fileName: file.name,
        fileFormat: detectedFormat,
        mimeType: file.type || 'application/pdf',
      });

      if (res.data?.success && res.data?.downloadUrl) {
        setFormData((prev) => ({
          ...prev,
          downloadUrl: res.data.downloadUrl,
          fileFormat: res.data.fileFormat || detectedFormat,
          fileSize: res.data.fileSize || formattedSize,
        }));
        // If upload succeeded, Drive is definitely connected
        setDriveStatus((prev) => ({ ...prev, isConnected: true }));
      } else {
        throw new Error(res.data?.message || 'Failed to upload digital book file');
      }
    } catch (err) {
      console.error('Digital file upload error:', err);
      const errMsg =
        err.response?.data?.message || err.message || 'Digital file upload failed';
      setDriveUploadError(errMsg);
    } finally {
      setUploadingDriveFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericPrice = Number(formData.price) || 0;
    const numericOriginalPrice =
      formData.originalPrice !== '' && formData.originalPrice !== null && !isNaN(Number(formData.originalPrice))
        ? Number(formData.originalPrice)
        : numericPrice;

    const sanitizedData = {
      ...formData,
      price: numericPrice,
      originalPrice: numericOriginalPrice,
      description:
        formData.description?.trim() ||
        `${formData.title} by ${formData.author}. Premium digital eBook edition available for instant download on redkitindia.`,
    };
    onSave(sanitizedData);
  };

  const categories = BOOK_CATEGORIES.filter((c) => c !== 'All');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#13161c] border border-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden text-white my-6">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold font-display leading-tight">
                {book ? 'Edit Book Specifications' : 'Add New Book to Digital Catalog'}
              </h3>
              <p className="text-[11px] text-gray-400">
                ImageKit CDN cover hosting &amp; Google Drive instant downloads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Book Title *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Clean Code in JavaScript"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Author Name *</label>
              <input
                type="text"
                name="author"
                required
                placeholder="e.g. Robert C. Martin"
                value={formData.author}
                onChange={handleChange}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Category, Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#13161c]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                required
                min="0"
                placeholder="399"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                Original Price (₹) *
              </label>
              <input
                type="number"
                name="originalPrice"
                required
                min="0"
                placeholder="799"
                value={formData.originalPrice}
                onChange={handleChange}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Format & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                File Format (Auto-detected on upload)
              </label>
              <select
                name="fileFormat"
                value={formData.fileFormat}
                onChange={handleChange}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {FILE_FORMATS.map((f) => (
                  <option key={f} value={f} className="bg-[#13161c]">
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                File Size (Auto-calculated on upload)
              </label>
              <input
                type="text"
                name="fileSize"
                placeholder="4.2 MB"
                value={formData.fileSize}
                onChange={handleChange}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: ImageKit Book Cover Upload */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-amber-400" />
                <span className="text-xs font-extrabold text-white">Book Cover Image</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                  ImageKit CDN
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualImageUrl(!showManualImageUrl)}
                className="text-[11px] text-gray-400 hover:text-amber-400 font-bold transition-colors"
              >
                {showManualImageUrl ? 'Hide URL field' : 'Enter URL manually'}
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Error Message */}
            {imageUploadError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{imageUploadError}</span>
              </div>
            )}

            {/* Upload Area / Preview */}
            {formData.image ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-[#0b0c0e] border border-gray-800 rounded-xl">
                <img
                  src={formData.image}
                  alt="Book Cover Preview"
                  className="w-16 h-24 object-cover rounded-lg shadow-md border border-gray-800 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                    <CheckCircle2 size={13} />
                    <span>ImageKit CDN Active</span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate max-w-sm" title={formData.image}>
                    {formData.image}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Upload size={12} />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                    className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploadingImage && imageInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-800 hover:border-amber-500/60 rounded-xl p-5 text-center cursor-pointer transition-all bg-black/20 hover:bg-black/40 ${
                  uploadingImage ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="text-amber-400 animate-spin" />
                    <span className="text-xs font-bold text-amber-400">
                      Uploading cover to ImageKit CDN...
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Generating fast global endpoints via ik.imagekit.io
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Upload size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Click to upload Book Cover Image
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        PNG, JPG, or WEBP up to 15MB • Uploads directly to ImageKit CDN
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optional Manual URL input */}
            {showManualImageUrl && (
              <div className="pt-2">
                <input
                  type="url"
                  name="image"
                  placeholder="https://ik.imagekit.io/..."
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: Digital eBook Upload (Google Drive + Cloud CDN Storage) */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-blue-400" />
                <span className="text-xs font-extrabold text-white">Digital eBook File</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold px-2 py-0.5 rounded-full">
                  {driveStatus.isConnected ? 'Google Drive Active' : 'Cloud CDN Active'}
                </span>
              </div>

              {/* Drive Connection Status Badge */}
              <div className="flex items-center gap-2">
                {driveStatus.isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} />
                    <span>Drive Connected</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectDrive}
                    disabled={authorizingDrive}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-colors"
                    title="Connect Google Drive Account (Optional)"
                  >
                    <LinkIcon size={12} />
                    <span>{authorizingDrive ? 'Connecting...' : 'Link Google Drive'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={checkDriveConnection}
                  disabled={checkingDrive}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Check Drive Connection Status"
                >
                  <RefreshCw size={12} className={checkingDrive ? 'animate-spin' : ''} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualDownloadUrl(!showManualDownloadUrl)}
                  className="text-[11px] text-gray-400 hover:text-amber-400 font-bold transition-colors ml-1"
                >
                  {showManualDownloadUrl ? 'Hide URL' : 'Manual URL'}
                </button>
              </div>
            </div>

            {/* Storage Status Information Banner */}
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-blue-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                <span>
                  Direct Cloud Storage is ready. Uploaded eBooks generate instant customer download links.
                </span>
              </div>
              {!driveStatus.isConnected && (
                <span className="text-[11px] text-blue-400 font-medium">
                  (Google Drive linking optional)
                </span>
              )}
            </div>

            {/* Hidden native eBook file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.epub,.mobi,.azw3,.zip"
              className="hidden"
              onChange={handleDriveFileChange}
            />

            {/* Error Message */}
            {driveUploadError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{driveUploadError}</span>
              </div>
            )}

            {/* Upload Area / File Card */}
            {formData.downloadUrl ? (
              <div className="p-3 bg-[#0b0c0e] border border-gray-800 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Digital eBook File Ready</span>
                        <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                          {formData.fileFormat || 'PDF'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formData.fileSize || '4.2 MB'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate max-w-sm mt-0.5" title={formData.downloadUrl}>
                        {formData.downloadUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={formData.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <ExternalLink size={12} />
                      <span>Test Download</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingDriveFile}
                      className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Upload size={12} />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, downloadUrl: '' }))}
                      className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      title="Remove File Link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (!uploadingDriveFile) {
                    fileInputRef.current?.click();
                  }
                }}
                className={`border-2 border-dashed border-gray-800 hover:border-blue-500/60 rounded-xl p-5 text-center cursor-pointer transition-all bg-black/20 hover:bg-black/40 ${
                  uploadingDriveFile ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {uploadingDriveFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="text-blue-400 animate-spin" />
                    <span className="text-xs font-bold text-blue-400">
                      Uploading eBook file to Cloud Storage...
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Generating fast direct download link and calculating file specifications
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <HardDrive size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Click to upload eBook (PDF, EPUB, MOBI, ZIP)
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        PDF, EPUB, MOBI up to 50MB • Automatically configures direct customer download links
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optional Manual Download URL Input */}
            {showManualDownloadUrl && (
              <div className="pt-2">
                <input
                  type="url"
                  name="downloadUrl"
                  placeholder="https://drive.google.com/uc?export=download&id=..."
                  value={formData.downloadUrl}
                  onChange={handleChange}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Book Description */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Book Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Provide a compelling overview of this book, target audience, and key learnings..."
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Featured & Bestseller Checkboxes */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="accent-amber-500 w-4 h-4 rounded"
              />
              <span className="text-gray-200">Featured in Hero / Showcase</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                name="isBestseller"
                checked={formData.isBestseller}
                onChange={handleChange}
                className="accent-amber-500 w-4 h-4 rounded"
              />
              <span className="text-gray-200">Mark as Bestseller</span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage || uploadingDriveFile}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold rounded-xl text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{book ? 'Update Book' : 'Publish Book'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBookForm;
