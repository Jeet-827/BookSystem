import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    downloadUrl: {
      type: String,
      default: '',
      trim: true,
    },
    fileFormat: {
      type: String,
      default: 'PDF',
      enum: ['PDF', 'EPUB', 'MOBI', 'DOCX'],
    },
    fileSize: {
      type: String,
      default: '3.5 MB',
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Self-Help',
        'Children',
        'Mystery',
        'Romance',
      ],
    },
    rating: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 10,
      min: 0,
    },
    isbn: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      default: 'English',
    },
    pages: {
      type: Number,
    },
    publisher: {
      type: String,
    },
    publishedYear: {
      type: Number,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual for discount percentage calculation
bookSchema.virtual('discountPercent').get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

const Book = mongoose.model('Book', bookSchema);
export default Book;
