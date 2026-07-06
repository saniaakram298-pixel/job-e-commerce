import mongoose, { Schema, Model } from 'mongoose';

export interface ICategory {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
    autoIndex: true,
  }
);

if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

export const Category: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema);
