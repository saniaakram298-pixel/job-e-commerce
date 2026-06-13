import mongoose, { Schema, Model } from 'mongoose';

export interface ICollection {
  _id: mongoose.Types.ObjectId | string;
  title: string;
  productId?: mongoose.Types.ObjectId | string;
  collection?: string;
  category: string;
  img: string;
  tags?: string[];
  sizes?: Array<{ size: string; stock: number }>;
  stock: number;
  price?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    title: {
      type: String,
      required: true,
    },
    collection: {
      type: String,
      default: 'new-arrival',
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    img: {
      type: String,
      required: true,
    },
    tags: [String],
    sizes: [
      {
        size: String,
        stock: { type: Number, default: 0 },
      },
    ],
    stock: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
  },
  { timestamps: true }
);

collectionSchema.index({ createdAt: -1 });

if (mongoose.models.Collection) {
  delete mongoose.models.Collection;
}
export const Collection: Model<ICollection> = mongoose.model<ICollection>('Collection', collectionSchema);
