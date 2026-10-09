import mongoose from 'mongoose';

const posterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Poster title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    badge: {
      type: String,
      trim: true,
      default: 'Featured Collection',
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'All',
    },
    ctaText: {
      type: String,
      default: 'Explore eBooks',
    },
    ctaLink: {
      type: String,
      default: '/books',
    },
    theme: {
      type: String,
      enum: ['blue', 'amber', 'emerald', 'violet', 'rose', 'slate', 'indigo'],
      default: 'blue',
    },
    discountCode: {
      type: String,
      default: 'READMORE',
    },
    discountText: {
      type: String,
      default: 'Save up to 40%',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Poster = mongoose.model('Poster', posterSchema);
export default Poster;
