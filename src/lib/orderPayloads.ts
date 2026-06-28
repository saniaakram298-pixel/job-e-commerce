export interface GuestOrderItemPayload {
  productId?: string;
  id?: string;
  _id?: string;
  name?: string;
  quantity?: number | string;
  price?: number | string;
  size?: string;
  color?: string;
}

export interface GuestOrderPayload {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  paymentMethod?: string;
  items?: GuestOrderItemPayload[];
  totalPrice?: number | string;
  customer?: Record<string, unknown>;
  type?: string;
}

export interface NormalizedGuestOrderPayload {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  paymentMethod?: string;
  items: GuestOrderItemPayload[];
  totalPrice: number;
  customer?: Record<string, unknown>;
  type?: string;
}

export function normalizeGuestOrderPayload(body: GuestOrderPayload | Record<string, unknown> | null | undefined): NormalizedGuestOrderPayload {
  const safeBody = (body || {}) as GuestOrderPayload & Record<string, unknown>;
  const bodyRecord = safeBody as Record<string, unknown>;
  const customer = (bodyRecord['customer'] as Record<string, unknown> | undefined) ?? ({} as Record<string, unknown>);

  const rawCustomerName =
    (bodyRecord['customerName'] as string | undefined) ||
    (customer['name'] as string | undefined) ||
    (customer['firstName'] as string | undefined) ||
    (customer['lastName'] as string | undefined)
      ? `${(customer['firstName'] as string | undefined) || ''} ${(customer['lastName'] as string | undefined) || ''}`.trim()
      : '';

  const customerName = rawCustomerName || '';
  const customerEmail =
    (bodyRecord['customerEmail'] as string | undefined) ||
    (bodyRecord['email'] as string | undefined) ||
    (customer['email'] as string | undefined) ||
    '';
  const customerPhone = (bodyRecord['customerPhone'] as string | undefined) || '';

  const normalizedItems = Array.isArray(bodyRecord['items'])
    ? (bodyRecord['items'] as GuestOrderItemPayload[]).map((item: GuestOrderItemPayload) => ({
        ...item,
        productId: item?.productId || item?.id || item?._id,
        quantity: Number(item?.quantity) || 0,
        price: Number(item?.price) || 0,
        size: item?.size,
        color: item?.color,
      }))
    : [];

  const orderItems = normalizedItems.filter((item: any) => item.productId && item.quantity > 0);
  const computedTotalPrice =
    typeof safeBody.totalPrice === 'number'
      ? safeBody.totalPrice
      : Number(safeBody.totalPrice) ||
        orderItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  return {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress: (safeBody.shippingAddress as Record<string, unknown> | undefined) || undefined,
    billingAddress: (safeBody.billingAddress as Record<string, unknown> | undefined) || undefined,
    paymentMethod: (safeBody.paymentMethod as string | undefined) || 'cash-on-delivery',
    items: orderItems,
    totalPrice: computedTotalPrice,
    customer: customer as Record<string, unknown> | undefined,
    type: (safeBody.type as string | undefined) || undefined,
  };
}

export function buildGuestOrderPayload(input: GuestOrderPayload): NormalizedGuestOrderPayload {
  return normalizeGuestOrderPayload(input);
}
