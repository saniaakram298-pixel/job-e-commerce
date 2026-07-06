import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Collection } from '@/models/Collection';
import { createErrorResponse, createSuccessResponse, getAuthToken } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectDB();

    // Get all orders
    const orders = await Order.find({}).select('items').lean();

    // Count sales by product
    const productSales: { [key: string]: { quantity: number; revenue: number; title?: string; category?: string; productId: string } } = {};

    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productId = item.productId?.toString() || item.name;

          if (!productSales[productId]) {
            productSales[productId] = {
              quantity: 0,
              revenue: 0,
              title: item.name,
              category: 'Product',
              productId,
            };
          }

          productSales[productId].quantity += item.quantity || 1;
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    // Get product details from collections
    const productIds = Object.keys(productSales);
    const collections = await Collection.find({ _id: { $in: productIds } }).select('_id title category img').lean();

    const productMap = new Map(collections.map((c: any) => [c._id.toString(), c]));

    // Format and sort by sales
    const bestSellers = Object.entries(productSales)
      .map(([productId, data]) => {
        const productDetail = productMap.get(productId);
        return {
          _id: productId,
          title: productDetail?.title || data.title || 'Unknown Product',
          category: productDetail?.category || data.category || 'Uncategorized',
          totalSales: data.quantity,
          quantity: data.quantity,
          revenue: Math.round(data.revenue),
          img: productDetail?.img,
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return createSuccessResponse(bestSellers, 'Best sellers retrieved');
  } catch (error) {
    console.error('Best sellers error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
