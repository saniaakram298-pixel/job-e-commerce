import mongoose, { Model, Schema, Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface IReview {
  _id?: Types.ObjectId | string;
  productId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  orderId?: Types.ObjectId | string | null;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  images?: string[];
  status: ReviewStatus;
  adminResponse?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, trim: true, lowercase: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    images: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
    adminResponse: { type: String, trim: true },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, userId: 1, status: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });

export async function syncProductReviewStats(productId: Types.ObjectId | string) {
  try {
    await connectDB();
    const normalizedProductId = typeof productId === 'string' ? productId : productId.toString();

    const result = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(normalizedProductId), status: 'approved' } },
      { $group: { _id: '$productId', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]);

    const summary = result[0] || { averageRating: 0, totalReviews: 0 };

    await Product.findByIdAndUpdate(
      normalizedProductId,
      {
        $set: {
          averageRating: Number(summary.averageRating || 0),
          totalReviews: Number(summary.totalReviews || 0),
          rating: Number(summary.averageRating || 0),
        },
      },
      { new: true }
    );

    return summary;
  } catch (error) {
    console.error('Failed to sync product review stats:', error);
    return { averageRating: 0, totalReviews: 0 };
  }
}

export const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
