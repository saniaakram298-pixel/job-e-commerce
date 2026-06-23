import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    await connectDB();

    // Verify admin access
    const requestingUser = await User.findById(userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return createErrorResponse('Admin access required', 403);
    }

    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orders = await Order.find({
      createdAt: { $gte: sevenDaysAgo },
    }).select('totalPrice createdAt orderStatus');

    // Organize data by day
    const salesByDay: { [key: string]: { revenue: number; orders: number } } = {};

    // Initialize 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      salesByDay[dateStr] = { revenue: 0, orders: 0 };
    }

    // Aggregate order data
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (salesByDay[dateStr]) {
        salesByDay[dateStr].revenue += order.totalPrice || 0;
        salesByDay[dateStr].orders += 1;
      }
    });

    // Convert to array for chart
    const chartData = Object.entries(salesByDay).map(([date, data]) => ({
      date,
      revenue: parseFloat(data.revenue.toFixed(2)),
      orders: data.orders,
    }));

    return createSuccessResponse(chartData, 'Weekly sales data retrieved successfully');
  } catch (error) {
    console.error('Weekly sales error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
