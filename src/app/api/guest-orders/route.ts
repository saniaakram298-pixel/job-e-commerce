import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { sendOrderConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress,
      paymentMethod,
      items,
      totalPrice,
    } = body;

    if (!customerName || !customerEmail || !shippingAddress || !billingAddress || !items || !items.length) {
      return NextResponse.json({ success: false, message: 'Missing required order details' }, { status: 400 });
    }

    // Atomic stock validation and decrement for all items
    for (const item of items) {
      const { productId, quantity, size, color } = item;

      if (!productId || !quantity || quantity <= 0) {
        return NextResponse.json({ success: false, message: 'Invalid item details in order' }, { status: 400 });
      }

      let updatedProduct = null;

      // If size is specified, decrement size stock
      if (size) {
        updatedProduct = await Product.findOneAndUpdate(
          {
            _id: productId,
            'sizes.size': size,
            'sizes.stock': { $gte: quantity },
          },
          {
            $inc: { 'sizes.$.stock': -quantity },
          },
          { new: true }
        );

        if (!updatedProduct) {
          return NextResponse.json(
            { success: false, message: `Product "${item.name || productId}" with size "${size}" is out of stock or not available` },
            { status: 400 }
          );
        }
      }
      // If color is specified (and no size), decrement color stock
      else if (color) {
        updatedProduct = await Product.findOneAndUpdate(
          {
            _id: productId,
            'colors.color': color,
            'colors.stock': { $gte: quantity },
          },
          {
            $inc: { 'colors.$.stock': -quantity },
          },
          { new: true }
        );

        if (!updatedProduct) {
          return NextResponse.json(
            { success: false, message: `Product "${item.name || productId}" with color "${color}" is out of stock or not available` },
            { status: 400 }
          );
        }
      }
      // If neither size nor color is specified, verify product exists
      else {
        const product = await Product.findById(productId);
        if (!product) {
          return NextResponse.json(
            { success: false, message: `Product "${item.name || productId}" not found` },
            { status: 400 }
          );
        }
      }
    }

    // All stock checks passed, now create the order
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
        text: `Thank you for your order, ${customerName}!\n\nOrder total: $${totalPrice.toFixed(2)}\nPayment method: ${paymentMethod}\n\nWe will contact you once your order is ready for delivery.`,
        html: `<div style="font-family: Arial, sans-serif; line-height:1.5; color:#111"><h2>Thank you for your order, ${customerName}!</h2><p>Your order total is <strong>$${totalPrice.toFixed(2)}</strong>.</p><p>Payment method: <strong>${paymentMethod}</strong></p><p>We will contact you when your order is ready for delivery.</p></div>`,
      });
    } catch (emailError) {
      console.error('[guest-orders] Email send failed:', emailError);
    }

    return NextResponse.json({ success: true, message: 'Order created successfully', orderId: order._id }, { status: 201 });
  } catch (error: any) {
    console.error('[guest-orders] Create order failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
