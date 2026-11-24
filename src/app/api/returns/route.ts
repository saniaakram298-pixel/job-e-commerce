import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { IReturnRequest, ReturnRequest } from '@/models/ReturnRequest';
import { IOrder, Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { User } from '@/models/User';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { sendEmail } from '@/lib/email';
import mongoose, { HydratedDocument } from 'mongoose';
import { isReplicaSetRequired } from '@/lib/orderTransactions';

export const dynamic = 'force-dynamic';

function buildReturnEligibilityMessage(order: any) {
  if (!order?.orderStatus || order.orderStatus !== 'delivered') {
    return 'Returns are only available for delivered orders.';
  }

  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : order.updatedAt ? new Date(order.updatedAt) : null;
  if (!deliveredAt || Number.isNaN(deliveredAt.getTime())) {
    return 'This order cannot be returned because the delivery date is unavailable.';
  }

  const expiresAt = new Date(deliveredAt);
  expiresAt.setDate(expiresAt.getDate() + 7);
  const now = new Date();

  if (now > expiresAt) {
    return 'This order cannot be returned because the 7 days return period has expired.';
  }

  return '';
}

async function getOrderWithProducts(orderId: string) {
  const order = await Order.findById(orderId).lean();
  if (!order) return null;

  const populatedItems = await Promise.all(
    (order.items || []).map(async (item: any) => {
      if (item.productId && typeof item.productId === 'object') {
        return item;
      }
      const product = await Product.findById(item.productId).select('name img images').lean();
      return {
        ...item,
        productId: product || null,
      };
    })
  );

  return {
    ...order,
    items: populatedItems,
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    const userId = token ? getUserIdFromToken(token) : null;

    await connectDB();

    let requestingUser: any = null;
    if (userId) {
      requestingUser = await User.findById(userId);
      if (!requestingUser) {
        return createErrorResponse('User not found', 401);
      }
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const emailQuery = searchParams.get('email')?.trim().toLowerCase() || '';
    const scope = searchParams.get('scope') || 'user';

    if (scope === 'admin') {
      if (!token || !userId || !requestingUser || requestingUser.role !== 'admin') {
        return createErrorResponse('Admin access required', 403);
      }

      const returns = await ReturnRequest.find({})
        .sort({ createdAt: -1 })
        .populate({ path: 'orderId', select: 'orderNumber customerName customerEmail totalPrice orderStatus deliveredAt' })
        .populate({ path: 'productId', select: 'name img images' })
        .lean();

      return createSuccessResponse(returns, 'Return requests fetched successfully');
    }

    if (orderId) {
      const emailFilter = emailQuery || (requestingUser?.email ? String(requestingUser.email).toLowerCase() : '');
      const returnRequest = await ReturnRequest.findOne({ orderId, ...(emailFilter ? { email: emailFilter } : {}) })
        .populate({ path: 'orderId', select: 'orderNumber customerName customerEmail totalPrice orderStatus deliveredAt' })
        .populate({ path: 'productId', select: 'name img images' })
        .lean();
      return createSuccessResponse(returnRequest || null, 'Return request fetched successfully');
    }

    if (!requestingUser?.email) {
      return createErrorResponse('Email is required to view return requests', 400);
    }

    const returns = await ReturnRequest.find({ email: String(requestingUser.email).toLowerCase() })
      .sort({ createdAt: -1 })
      .populate({ path: 'orderId', select: 'orderNumber customerName customerEmail totalPrice orderStatus deliveredAt' })
      .populate({ path: 'productId', select: 'name img images' })
      .lean();

    return createSuccessResponse(returns, 'Return requests fetched successfully');
  } catch (error) {
    console.error('Returns GET error:', error);
    return createErrorResponse('Unable to load return requests', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    const userId = token ? getUserIdFromToken(token) : null;

    await connectDB();

    let requestingUser: any = null;
    if (userId) {
      requestingUser = await User.findById(userId);
      if (!requestingUser) {
        return createErrorResponse('User not found', 401);
      }
    }

    const formData = await request.formData();
    const orderId = String(formData.get('orderId') || '').trim();
    const customerName = String(formData.get('customerName') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const reason = String(formData.get('reason') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const productId = String(formData.get('productId') || '').trim();

    if (!orderId || !customerName || !email || !reason) {
      return createErrorResponse('Customer name, email, order, and reason are required.', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return createErrorResponse('Order not found.', 404);
    }

    const isOwner = String(order.customerEmail || '').toLowerCase() === email || (userId && String(order.userId || '') === String(userId));
    if (!isOwner) {
      return createErrorResponse('You are not authorized to create a return for this order.', 403);
    }

    const existingReturn = await ReturnRequest.findOne({ orderId, email });
    if (existingReturn) {
      return createErrorResponse('A return request already exists for this order.', 409);
    }

    const eligibilityMessage = buildReturnEligibilityMessage(order);
    if (eligibilityMessage) {
      return createErrorResponse(eligibilityMessage, 400);
    }

    const uploadedImages: string[] = [];
    const imageFiles = formData.getAll('images');
    for (const file of imageFiles) {
      if (file instanceof File) {
        const uploadResult = await uploadToCloudinary(file, { folder: 'returns', resourceType: 'image' });
        uploadedImages.push(uploadResult.secureUrl);
      }
    }

    let videoUrl = '';
    const videoFile = formData.get('video');
    if (videoFile instanceof File) {
      const uploadResult = await uploadToCloudinary(videoFile, { folder: 'returns', resourceType: 'video' });
      videoUrl = uploadResult.secureUrl;
    }

    const returnRequest = new ReturnRequest({
      userId: userId || undefined,
      orderId,
      productId: productId || undefined,
      customerName,
      email,
      customerEmail: order.customerEmail || email,
      reason,
      description,
      images: uploadedImages,
      video: videoUrl || undefined,
      status: 'pending',
      history: [{ status: 'pending', note: 'Return request submitted', timestamp: new Date() }],
    });

    await returnRequest.save();

    order.returnStatus = 'pending';
    order.returnRequestedAt = new Date();
    order.returnNotes = description || reason;
    await order.save();

    try {
      await sendEmail({
        to: email,
        subject: 'Your return request has been received',
        text: `Hello ${customerName}, your return request for order ${order.orderNumber || orderId} has been submitted successfully. Our team will review it shortly.`,
        html: `<div style="font-family: Arial, sans-serif; line-height:1.6;"><h2>Return request received</h2><p>Hello ${customerName},</p><p>Your return request for order <strong>${order.orderNumber || orderId}</strong> has been submitted successfully. Our team will review it shortly.</p></div>`,
      });
    } catch (emailError) {
      console.warn('Return submission email failed:', emailError);
    }

    return createSuccessResponse(
      { returnRequest },
      'Your return request has been submitted successfully. Our team will review your request.'
    );
  } catch (error: any) {
    console.error('Create return request error:', error);
    return createErrorResponse(error.message || 'Unable to create return request.', 500);
  }
}

export async function PATCH(request: NextRequest) {
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

    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return createErrorResponse('User not found', 401);
    }

    const body = await request.json();
    const { returnId, status, adminMessage } = body || {};

    if (!returnId || !status || !['approved', 'rejected'].includes(status)) {
      return createErrorResponse('A valid return ID and status are required.', 400);
    }

    if (requestingUser.role !== 'admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const transaction = await mongoose.startSession();
    let updatedReturnRequest: HydratedDocument<IReturnRequest> | undefined;
    let updatedOrder: HydratedDocument<IOrder> | undefined;
    try {
      await transaction.withTransaction(async () => {
        const returnRequest = await ReturnRequest.findById(returnId).session(transaction);
        if (!returnRequest) throw new Error('RETURN_NOT_FOUND');
        if (returnRequest.status !== 'pending') throw new Error('RETURN_ALREADY_PROCESSED');

        const order = await Order.findById(returnRequest.orderId).session(transaction);
        if (!order) throw new Error('ORDER_NOT_FOUND');

        returnRequest.status = status;
        returnRequest.adminMessage = adminMessage || '';
        returnRequest.history.push({
          status,
          note: adminMessage || `Return request ${status}`,
          timestamp: new Date(),
        });

        if (status === 'approved') {
          order.returnStatus = 'approved';
          order.returnApprovedAt = new Date();
          order.orderStatus = 'delivered';
          order.returnNotes = adminMessage || 'Return approved';

          for (const item of order.items || []) {
            const productId = item.productId?.toString ? item.productId.toString() : String(item.productId || '');
            const quantity = Number(item.quantity);
            if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) {
              throw new Error('INVALID_RETURN_ITEM');
            }

            const increments: Record<string, number> = {};
            const arrayFilters: Record<string, unknown>[] = [];
            const conditions: Record<string, unknown>[] = [];
            const restoreSize = Boolean(item.size);
            const restoreColor = order.inventoryReserved ? Boolean(item.color) : Boolean(item.color && !item.size);

            if (restoreSize && item.size) {
              const escaped = String(item.size).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const pattern = new RegExp(`^${escaped}$`, 'i');
              conditions.push({ sizes: { $elemMatch: { size: pattern } } });
              arrayFilters.push({ 'sizeVariant.size': pattern });
              increments['sizes.$[sizeVariant].stock'] = quantity;
            }
            if (restoreColor && item.color) {
              const escaped = String(item.color).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const pattern = new RegExp(`^${escaped}$`, 'i');
              conditions.push({ colors: { $elemMatch: { color: pattern } } });
              arrayFilters.push({ 'colorVariant.color': pattern });
              increments['colors.$[colorVariant].stock'] = quantity;
            }
            if (!item.size && !item.color && order.inventoryReserved) {
              conditions.push({ stock: { $exists: true } });
              increments.stock = quantity;
            }

            if (Object.keys(increments).length > 0) {
              const result = await Product.updateOne(
                { _id: productId, $and: conditions },
                { $inc: increments },
                { session: transaction, ...(arrayFilters.length ? { arrayFilters } : {}) }
              );
              if (result.modifiedCount !== 1) throw new Error('RETURN_STOCK_NOT_FOUND');
            }
          }
          order.inventoryReserved = false;
        } else {
          order.returnStatus = 'rejected';
          order.returnRejectedAt = new Date();
          order.returnNotes = adminMessage || 'Return rejected';
        }

        await returnRequest.save({ session: transaction });
        await order.save({ session: transaction });
        updatedReturnRequest = returnRequest;
        updatedOrder = order;
      });
    } finally {
      await transaction.endSession();
    }

    const returnRequest = updatedReturnRequest;
    const order = updatedOrder;
    if (!returnRequest || !order) {
      return createErrorResponse('Return request could not be updated.', 500);
    }

    const customerEmail = returnRequest.email || order.customerEmail || '';
    if (customerEmail) {
      const subject = status === 'approved'
        ? 'Your return request has been approved'
        : 'Your return request has been rejected';
      const text = status === 'approved'
        ? 'Your return request has been approved. Your product return process has been accepted.'
        : `Your return request has been rejected. Reason: ${adminMessage || 'No additional reason provided.'}`;

      try {
        await sendEmail({
          to: customerEmail,
          subject,
          text,
          html: `<div style="font-family: Arial, sans-serif; line-height:1.6;"><h2>${subject}</h2><p>${text}</p></div>`,
        });
      } catch (emailError) {
        console.warn('Return decision email failed:', emailError);
      }
    }

    return createSuccessResponse({ returnRequest, order }, 'Return request updated successfully');
  } catch (error: any) {
    console.error('Update return request error:', error);
    if (isReplicaSetRequired(error)) {
      return createErrorResponse('MongoDB transactions require a replica set. Use MongoDB Atlas or configure a local replica set.', 503);
    }
    if (error?.message === 'RETURN_NOT_FOUND') return createErrorResponse('Return request not found.', 404);
    if (error?.message === 'ORDER_NOT_FOUND') return createErrorResponse('Order not found.', 404);
    if (error?.message === 'RETURN_ALREADY_PROCESSED') return createErrorResponse('Return request already processed.', 409);
    if (error?.message === 'RETURN_STOCK_NOT_FOUND') return createErrorResponse('Could not restore returned inventory.', 409);
    return createErrorResponse(error.message || 'Unable to update return request.', 500);
  }
}
