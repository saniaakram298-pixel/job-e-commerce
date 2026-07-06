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

export function normalizeGuestOrderPayload(
  body: GuestOrderPayload | Record<string, unknown> | null | undefined,
): NormalizedGuestOrderPayload {
  const safeBody = (body || {}) as GuestOrderPayload & Record<string, unknown>;
  const bodyRecord = safeBody as Record<string, unknown>;
  const customer = (bodyRecord['customer'] as Record<string, unknown> | undefined) ?? {};

  const explicitCustomerName = (bodyRecord['customerName'] as string | undefined)?.trim();
  const customerFullNameFromCustomer = [
    (customer['firstName'] as string | undefined)?.trim(),
    (customer['lastName'] as string | undefined)?.trim(),
  ]
    .filter(Boolean)
    .join(' ');

  const customerName =
    explicitCustomerName ||
    (customer['name'] as string | undefined)?.trim() ||
    customerFullNameFromCustomer ||
    '';

  const customerEmail =
    (bodyRecord['customerEmail'] as string | undefined)?.trim() ||
    (bodyRecord['email'] as string | undefined)?.trim() ||
    (customer['email'] as string | undefined)?.trim() ||
    '';

  const customerPhone = (bodyRecord['customerPhone'] as string | undefined)?.trim() || '';

  const shippingAddress =
    typeof safeBody.shippingAddress === 'object' && safeBody.shippingAddress !== null
      ? (safeBody.shippingAddress as Record<string, unknown>)
      : undefined;

  const billingAddress =
    typeof safeBody.billingAddress === 'object' && safeBody.billingAddress !== null
      ? (safeBody.billingAddress as Record<string, unknown>)
      : undefined;

  const normalizedItems = Array.isArray(bodyRecord['items'])
    ? (bodyRecord['items'] as GuestOrderItemPayload[]).map((item) => {
        const rawProductId = item?.productId || item?.id || item?._id;
        const productId = rawProductId !== undefined && rawProductId !== null ? String(rawProductId).trim() : '';

        return {
          ...item,
          productId: productId || undefined,
          quantity: Number(item?.quantity) || 0,
          price: Number(item?.price) || 0,
          size: item?.size,
          color: item?.color,
        };
      })
    : [];

  const orderItems = normalizedItems.filter(
    (item) => Boolean(item.productId) && Number(item.quantity) > 0,
  );

  const computedTotalPrice =
    typeof safeBody.totalPrice === 'number'
      ? safeBody.totalPrice
      : Number(safeBody.totalPrice) ||
        orderItems.reduce((sum: number, item) => sum + Number(item.price) * Number(item.quantity), 0);

  return {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    billingAddress,
    paymentMethod: (safeBody.paymentMethod as string | undefined)?.trim() || 'cash-on-delivery',
    items: orderItems,
    totalPrice: computedTotalPrice,
    customer: customer as Record<string, unknown> | undefined,
    type: (safeBody.type as string | undefined) || undefined,
  };
}

export function buildGuestOrderPayload(
  input: GuestOrderPayload,
): NormalizedGuestOrderPayload {
  return normalizeGuestOrderPayload(input);
}