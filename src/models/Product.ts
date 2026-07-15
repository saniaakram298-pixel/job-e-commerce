import mongoose, { Schema, Model } from 'mongoose';

export type ProductCategory = string;

export interface IProduct {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  collection: string;
  category: ProductCategory;
  subcategory?: string;
  images: string[];
  img?: string;
  mainImage?: string;
  thumbnails?: string[];
  video?: string;
  materials: string[];
  sizes: Array<{
    size: string;
    stock: number;
  }>;
  colors: Array<{
    color: string;
    stock: number;
  }>;
  tags: string[];
  rating: number;
  averageRating: number;
  totalReviews: number;
  careInstructions?: string;
  fit?: string;
  featured: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    collection: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      index: true,
    },
    images: [String],
    img: String,
    mainImage: String,
    thumbnails: [String],
    video: String,
    materials: [String],
    sizes: [
      {
        size: { type: String, required: true, trim: true },
        stock: { type: Number, default: 0, min: 0 },
      },
    ],
    colors: [
      {
        color: { type: String, required: true, trim: true },
        stock: { type: Number, default: 0, min: 0 },
      },
    ],
    tags: [String],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    careInstructions: String,
    fit: String,
    featured: {
      type: Boolean,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

// Create compound indexes for optimal query performance
// Note: Single field indexes are handled by field-level index: true properties
// These compound indexes optimize common query patterns
productSchema.index({ category: 1, createdAt: -1 }); // Category with latest products
productSchema.index({ category: 1, subcategory: 1, createdAt: -1 }); // Subcategory products
productSchema.index({ category: 1, active: 1 }); // Active products in category
productSchema.index({ subcategory: 1, active: 1, createdAt: -1 }); // Active subcategory products
productSchema.index({ featured: 1, createdAt: -1 }); // Featured products sorted by date
productSchema.index({ isBestSeller: 1, active: 1, createdAt: -1 }); // Best seller products by date
productSchema.index({ isTrending: 1, active: 1, createdAt: -1 }); // Trending products by date
productSchema.index({ category: 1, price: 1 }); // Category products with price sorting
productSchema.index({ active: 1, featured: 1, createdAt: -1 }); // Active featured products by date
productSchema.index({ collection: 1, category: 1 }); // Collection and category combination
productSchema.index({ collection: 1, category: 1, subcategory: 1 }); // Collection, category, and subcategory

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
