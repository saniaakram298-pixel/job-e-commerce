/**
 * Helper utilities for common operations
 */

import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { Review } from '@/models/Review';
import { connectDB } from './mongodb';

export async function getProductsByCategory(category: string, limit: number = 12) {
  await connectDB();
  return Product.find({ category, active: true }).limit(limit).sort({ createdAt: -1 });
}

export async function getFeaturedProducts(limit: number = 8) {
  await connectDB();
  return Product.find({ featured: true, active: true }).limit(limit);
}

export async function searchProducts(query: string) {
  await connectDB();
  return Product.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { collection: { $regex: query, $options: 'i' } },
    ],
    active: true,
  });
}

export async function getUserOrders(userId: string) {
  await connectDB();
  return Order.find({ userId }).sort({ createdAt: -1 });
}

export async function getProductReviews(productId: string) {
  await connectDB();
  return Review.find({ productId }).sort({ createdAt: -1 });
}

export async function getAverageRating(productId: string) {
  await connectDB();
  const result = await Review.aggregate([
    { $match: { productId: productId as any } },
    { $group: { _id: null, average: { $avg: '$rating' } } },
  ]);
  return result[0]?.average || 0;
}

export async function updateProductStock(productId: string, size: string, quantity: number) {
  await connectDB();
  return Product.findByIdAndUpdate(
    productId,
    {
      $inc: { 'sizes.$[elem].stock': -quantity },
    },
    { arrayFilters: [{ 'elem.size': size }], new: true }
  );
}
