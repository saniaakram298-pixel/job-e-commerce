import mongoose, { Model } from 'mongoose';

export interface IReview {
  _id?: mongoose.Types.ObjectId | string;
  name: string;
  email?: string;
  rating: number;
  message: string;
  productId?: string | null;
  approved?: boolean;
  createdAt?: Date;
}

const reviewSchema = new mongoose.Schema<IReview>(
  {
    name: { type: String, required: true },
    email: { type: String },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    message: { type: String, required: true },
    productId: { type: String, default: null },
    approved: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reviewSchema.index({ approved: 1, createdAt: -1 });

if ((mongoose as any).models?.Review) {
  delete (mongoose as any).models.Review;
}

export const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);
