import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { OrderCreationError, createOrderTransaction } from '@/lib/orderTransactions';
import { buildGuestOrderPayload, GuestOrderPayload } from '@/lib/orderPayloads';

export async function saveGuestOrder(payload: GuestOrderPayload) {
  const normalizedPayload = buildGuestOrderPayload(payload);

  try {
    const order = await createOrderTransaction({
      customerName: normalizedPayload.customerName,
      customerEmail: normalizedPayload.customerEmail,
      customerPhone: normalizedPayload.customerPhone,
      shippingAddress: normalizedPayload.shippingAddress,
      billingAddress: normalizedPayload.billingAddress,
      paymentMethod: normalizedPayload.paymentMethod,
      items: normalizedPayload.items,
    });

    try {
      await sendOrderConfirmationEmail({
        to: order.customerEmail!,
        subject: 'Your Atelier Order Confirmation',
        text: `Thank you for your order, ${order.customerName}!\n\nOrder total: $${order.totalPrice.toFixed(2)}\nPayment method: ${order.paymentMethod}\n\nWe will contact you once your order is ready for delivery.`,
        html: `<div style="font-family: Arial, sans-serif; line-height:1.5; color:#111"><h2>Thank you for your order, ${order.customerName}!</h2><p>Your order total is <strong>$${order.totalPrice.toFixed(2)}</strong>.</p><p>Payment method: <strong>${order.paymentMethod}</strong></p><p>We will contact you when your order is ready for delivery.</p></div>`,
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
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return {
        success: false,
        status: error.status,
        message: error.message,
      } as const;
    }
    throw error;
  }
}

export async function createGuestOrderResponse(payload: GuestOrderPayload) {
  const result = await saveGuestOrder(payload);
  if (!result.success) {
    return NextResponse.json({ success: false, message: result.message }, { status: result.status });
  }

  return NextResponse.json(
    { success: true, message: result.message, orderId: result.orderId },
    { status: result.status }
  );
}
