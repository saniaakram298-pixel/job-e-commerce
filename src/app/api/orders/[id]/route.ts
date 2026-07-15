import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

// Pehle se mojood GET function...
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const order = await Order.findById(params.id).populate({ path: 'items.productId', select: 'name images img' }).lean();
    if (!order) return createErrorResponse('Order not found', 404);

    for (const item of (order as any).items || []) {
      const productRef = item.productId;
      const hasProductDetails = productRef && typeof productRef === 'object' && ('img' in productRef || 'images' in productRef);
      if (!hasProductDetails && productRef) {
        const product = await Product.findById(productRef).select('name images img').lean();
        if (product) {
          item.productId = product;
        }
      }
    }

    return createSuccessResponse(order, 'Order fetched successfully');
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
  }
}

// Yahan PATCH function add karo:
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await request.json(); // Ismein 'orderStatus' hoga
    const order = await Order.findById(params.id);
    if (!order) return createErrorResponse('Order not found', 404);

    if (body.orderStatus) {
      const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!allowed.includes(body.orderStatus)) {
        return createErrorResponse('Invalid orderStatus value', 400);
      }

      if (body.orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
        for (const item of order.items || []) {
          const productId = item.productId;
          const quantity = Number(item.quantity) || 0;
          const size = item.size;
          const color = item.color;

          if (!productId || !quantity || quantity <= 0) continue;

          if (size) {
            await Product.updateOne(
              { _id: productId, 'sizes.size': new RegExp(`^${String(size).trim()}$`, 'i') },
              { $inc: { 'sizes.$.stock': quantity } }
            );
          } else if (color) {
            await Product.updateOne(
              { _id: productId, 'colors.color': new RegExp(`^${String(color).trim()}$`, 'i') },
              { $inc: { 'colors.$.stock': quantity } }
            );
          }
        }
      }

      order.orderStatus = body.orderStatus;
    }

    // Update item-level size/color. Expect body.items as array of { index?, productId?, size?, color? }
    if (Array.isArray(body.items)) {
      for (const update of body.items) {
        let idx = -1;
        if (typeof update.index === 'number' && update.index >= 0 && update.index < order.items.length) {
          idx = update.index;
        } else if (update.productId) {
          idx = order.items.findIndex((it: any) => {
            const pid = it.productId?.toString ? it.productId.toString() : it.productId;
            return pid === String(update.productId);
          });
        }

        if (idx === -1) continue; // skip if item not found

        if (typeof update.size === 'string') {
          order.items[idx].size = update.size;
        }
        if (typeof update.color === 'string') {
          order.items[idx].color = update.color;
        }
      }
    }

    await order.save();
    return createSuccessResponse(order, 'Order updated successfully');
  } catch (error) {
    console.error('Patch order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await Order.findById(params.id).session(session);
      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return createErrorResponse('Order not found', 404);
      }

      // Remove the order (follow-up notes are embedded so removing order removes them)
      await Order.deleteOne({ _id: params.id }).session(session);

      // If there were a separate FollowUps collection, we'd remove linked entries here.

      await session.commitTransaction();
      session.endSession();
      return createSuccessResponse({ orderId: params.id }, 'Order deleted successfully');
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Delete order transaction error:', err);
      return createErrorResponse('Failed to delete order', 500);
    }
  } catch (error) {
    console.error('Delete order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}