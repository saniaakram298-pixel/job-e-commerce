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

    // Get all orders
    const orders = await Order.find({}).select('userId customerEmail customerName totalPrice createdAt').lean();

    // Count orders by customer
    const customerOrderCount: { [key: string]: { orders: any[] } } = {};

    orders.forEach((order: any) => {
      const customerId = order.userId || order.customerEmail || 'unknown';

      if (!customerOrderCount[customerId]) {
        customerOrderCount[customerId] = { orders: [] };
      }

      customerOrderCount[customerId].orders.push(order);
    });

    // Filter customers with 2+ orders and format data
    const repeatedCustomers = Object.entries(customerOrderCount)
      .filter(([, data]) => data.orders.length > 1)
      .map(([customerId, data]) => {
        const firstOrder = data.orders[0];
        const totalSpent = data.orders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
        const lastOrder = data.orders.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        return {
          customerId,
          customerName: firstOrder.customerName || 'Unknown Customer',
          customerEmail: firstOrder.customerEmail || 'unknown@email.com',
          repeatCount: data.orders.length,
          totalSpent: Math.round(totalSpent),
          lastOrderDate: new Date(lastOrder.createdAt).toLocaleDateString(),
        };
      })
      .sort((a, b) => b.repeatCount - a.repeatCount)
      .slice(0, 20);

    return createSuccessResponse(repeatedCustomers, 'Repeated orders retrieved');
  } catch (error) {
    console.error('Repeated orders error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
