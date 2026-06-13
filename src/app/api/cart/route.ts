import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Cart } from '@/models/Cart';
import { Product } from '@/models/Product';
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

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return createSuccessResponse({ items: [], totalPrice: 0 }, 'Cart is empty');
    }

    return createSuccessResponse(cart, 'Cart fetched successfully');
  } catch (error) {
    console.error('Get cart error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    const body = await request.json();
    const { productId, quantity, size, color } = body;

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return createErrorResponse('Product not found', 404);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item: any) => item.productId === productId && item.size === size && item.color === color
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        size,
        color,
        price: product.discountPrice || product.price,
      });
    }

    cart.totalPrice = cart.items.reduce((total: number, item: any) => total + item.price * item.quantity, 0);

    await cart.save();

    return createSuccessResponse(cart, 'Item added to cart', 201);
  } catch (error) {
    console.error('Add to cart error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    const body = await request.json();
    const { productId, quantity, size, color } = body;

    await connectDB();

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return createErrorResponse('Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.productId === productId && item.size === size && item.color === color
    );

    if (itemIndex === -1) {
      return createErrorResponse('Item not found in cart', 404);
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.totalPrice = cart.items.reduce((total: number, item: any) => total + item.price * item.quantity, 0);

    await cart.save();

    return createSuccessResponse(cart, 'Cart updated successfully');
  } catch (error) {
    console.error('Update cart error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest) {
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

    await Cart.deleteOne({ userId });

    return createSuccessResponse(null, 'Cart cleared successfully');
  } catch (error) {
    console.error('Clear cart error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
