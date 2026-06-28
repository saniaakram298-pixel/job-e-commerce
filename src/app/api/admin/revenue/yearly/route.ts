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

    // Get orders from the last 12 months
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const orders = await Order.find({
      createdAt: { $gte: oneYearAgo },
    }).select('totalPrice orderStatus createdAt').lean();

    // Group by month
    const revenueByMonth: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach((order: any) => {
      const date = new Date(order.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = { revenue: 0, orders: 0 };
      }

      revenueByMonth[monthKey].revenue += order.totalPrice || 0;
      revenueByMonth[monthKey].orders += 1;
    });

    // Format response
    const chartData = Object.entries(revenueByMonth).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    }));

    return createSuccessResponse(chartData, 'Yearly revenue data retrieved');
  } catch (error) {
    console.error('Yearly revenue error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
