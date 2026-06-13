import mongoose, { Schema, Model } from 'mongoose';

export type ProductCategory = 
  | 'bridal' 
  | 'groom' 
  | 'formal' 
  | 'informal' 
  | 'children' 
  | 'men' 
  | 'women' 
  | 'old-people' 
  | 'young' 
  | 'new-arrival'
  | 'accessories';

export interface IProduct {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  collection: string;
  category: ProductCategory;
  images: string[];
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
  reviews: string[];
  careInstructions?: string;
  fit?: string;
  featured: boolean;
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
      enum: ['bridal', 'groom', 'formal', 'informal', 'children', 'men', 'women', 'old-people', 'young', 'new-arrival', 'accessories'],
      required: true,
      index: true,
    },
    images: [String],
    materials: [String],
    sizes: [
      {
        size: String,
        stock: { type: Number, default: 0 },
      },
    ],
    colors: [
      {
        color: String,
        stock: { type: Number, default: 0 },
      },
    ],
    tags: [String],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [String],
    careInstructions: String,
    fit: String,
    featured: {
      type: Boolean,
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

// Create indexes for better query performance
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ featured: 1, createdAt: -1 });
productSchema.index({ active: 1, category: 1 });

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}
export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
