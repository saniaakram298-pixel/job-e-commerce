import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { createErrorResponse, createSuccessResponse, getAuthToken } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectDB();

    // Get orders from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
    }).select('totalPrice orderStatus createdAt').lean();

    // Group by week
    const revenueByWeek: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach((order: any) => {
      const date = new Date(order.createdAt);
      const weekNum = Math.ceil(date.getDate() / 7);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const weekKey = `${month} W${weekNum}`;

      if (!revenueByWeek[weekKey]) {
        revenueByWeek[weekKey] = { revenue: 0, orders: 0 };
      }

      revenueByWeek[weekKey].revenue += order.totalPrice || 0;
      revenueByWeek[weekKey].orders += 1;
    });

    // Format response
    const chartData = Object.entries(revenueByWeek).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    }));

    return createSuccessResponse(chartData, 'Monthly revenue data retrieved');
  } catch (error) {
    console.error('Monthly revenue error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
