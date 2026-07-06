import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectDB();

    // Get orders from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orders = await Order.find({
      createdAt: { $gte: sevenDaysAgo },
    }).select('totalPrice orderStatus createdAt').lean();

    // Group by date
    const revenueByDate: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach((order: any) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!revenueByDate[date]) {
        revenueByDate[date] = { revenue: 0, orders: 0 };
      }

      revenueByDate[date].revenue += order.totalPrice || 0;
      revenueByDate[date].orders += 1;
    });

    // Format response
    const chartData = Object.entries(revenueByDate).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    }));

    return createSuccessResponse(chartData, 'Weekly revenue data retrieved');
  } catch (error) {
    console.error('Weekly revenue error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
