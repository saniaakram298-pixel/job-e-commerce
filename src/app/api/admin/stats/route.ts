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

    // Get all orders
    const allOrders = await Order.find({}).select('totalPrice orderStatus createdAt userId customerEmail');
    
    // Calculate stats
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
    
    // Get unique customers (both userId and customerEmail for guests)
    const uniqueCustomers = new Set();
    allOrders.forEach(order => {
      if (order.userId) {
        uniqueCustomers.add(order.userId);
      } else if (order.customerEmail) {
        uniqueCustomers.add(order.customerEmail);
      }
    });
    const totalCustomers = uniqueCustomers.size;

    return createSuccessResponse(
      {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        pendingOrders,
        totalCustomers,
      },
      'Dashboard stats retrieved successfully'
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
