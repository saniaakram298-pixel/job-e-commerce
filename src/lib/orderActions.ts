import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { buildGuestOrderPayload, GuestOrderPayload } from '@/lib/orderPayloads';

export async function saveGuestOrder(payload: GuestOrderPayload) {
  const normalizedPayload = buildGuestOrderPayload(payload);
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    billingAddress,
    paymentMethod,
    items,
    totalPrice,
  } = normalizedPayload;

  if (!customerName || !customerEmail || !shippingAddress || !billingAddress || items.length === 0) {
    return {
      success: false,
      status: 400,
      message: 'Missing required order details',
    } as const;
  }

  await connectDB();

  for (const item of items) {
    const productId = item.productId || item.id || item._id;
    const quantity = Number(item.quantity) || 0;
    const size = item.size;
    const color = item.color;

    if (!productId || !quantity || quantity <= 0) {
      return {
        success: false,
        status: 400,
        message: 'Invalid item details in order',
      } as const;
    }

    if (size) {
      const normalizedSize = (size || '').trim();
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          'sizes.size': new RegExp(`^${normalizedSize}$`, 'i'),
          'sizes.stock': { $gte: quantity },
        },
        {
          $inc: { 'sizes.$.stock': -quantity },
        },
        { new: true }
      );

      if (!updatedProduct) {
        return {
          success: false,
          status: 400,
          message: `Product "${item.name || productId}" with size "${size}" is out of stock or not available`,
        } as const;
      }
    } else if (color) {
      const normalizedColor = (color || '').trim();
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          'colors.color': new RegExp(`^${normalizedColor}$`, 'i'),
          'colors.stock': { $gte: quantity },
        },
        {
          $inc: { 'colors.$.stock': -quantity },
        },
        { new: true }
      );

      if (!updatedProduct) {
        return {
          success: false,
          status: 400,
          message: `Product "${item.name || productId}" with color "${color}" is out of stock or not available`,
        } as const;
      }
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return {
          success: false,
          status: 400,
          message: `Product "${item.name || productId}" not found`,
        } as const;
      }
    }
  }

  const lastOrder = await Order.findOne({ orderNumber: { $exists: true } }).sort({ orderNumber: -1 }).select('orderNumber');
  const nextOrderNumber = lastOrder?.orderNumber ? lastOrder.orderNumber + 1 : 1;

  const order = new Order({
    userId: undefined,
    orderNumber: nextOrderNumber,
    customerName,
    customerEmail,
    customerPhone,
    items,
    totalPrice,
    shippingAddress,
    billingAddress,
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
  });

  await order.save();

  try {
    await sendOrderConfirmationEmail({
      to: customerEmail,
      subject: 'Your Atelier Order Confirmation',
      text: `Thank you for your order, ${customerName}!\n\nOrder total: $${Number(totalPrice || 0).toFixed(2)}\nPayment method: ${paymentMethod}\n\nWe will contact you once your order is ready for delivery.`,
      html: `<div style="font-family: Arial, sans-serif; line-height:1.5; color:#111"><h2>Thank you for your order, ${customerName}!</h2><p>Your order total is <strong>$${Number(totalPrice || 0).toFixed(2)}</strong>.</p><p>Payment method: <strong>${paymentMethod}</strong></p><p>We will contact you when your order is ready for delivery.</p></div>`,
    });
  } catch (emailError) {
    console.error('[guest-orders] Email send failed:', emailError);
  }

  return {
    success: true,
    status: 201,
    message: 'Order created successfully',
    orderId: order._id,
  } as const;
}

export async function createGuestOrderResponse(payload: GuestOrderPayload) {
  const result = await saveGuestOrder(payload);
  if (!result.success) {
    return NextResponse.json({ success: false, message: result.message }, { status: result.status });
  }

  return NextResponse.json({ success: true, message: result.message, orderId: result.orderId }, { status: result.status });
}
