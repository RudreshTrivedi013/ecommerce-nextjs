import { NextRequest } from 'next/server';
import { AddToCartSchema, UpdateQuantitySchema } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET: Fetch all cart items joined with product info
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const userId = auth.userId;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    return successResponse(cartItems, 'Cart retrieved successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to retrieve cart: ${msg}`, 500);
  }
}

// POST: Add item to cart or increment quantity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = AddToCartSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.errors[0]?.message || 'Invalid parameters', 400);
    }

    const { productId, quantity } = result.data;
    const auth = requireAuth(request);
    const userId = auth.userId;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      return errorResponse('Product not found', 404);
    }
    if (product.stock < quantity) {
      return errorResponse(`Insufficient stock. Only ${product.stock} available.`, 400);
    }

    // Check if item already exists in user's cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { userId, productId }
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return errorResponse(`Cannot add more. Insufficient stock. Only ${product.stock} available in total.`, 400);
      }

      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true }
      });
      return successResponse(updated, 'Cart quantity updated');
    }

    // Otherwise, create new cart item
    const newItem = await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity
      },
      include: { product: true }
    });

    return successResponse(newItem, 'Item added to cart', 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to add item to cart: ${msg}`, 500);
  }
}

// PATCH: Update quantity of a cart item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = UpdateQuantitySchema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.errors[0]?.message || 'Invalid parameters', 400);
    }

    const { quantity } = result.data;
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId') || body.cartItemId;
    const productId = body.productId;

    if (!cartItemId && !productId) {
      return errorResponse('Either cartItemId or productId is required to update quantity', 400);
    }

    const auth = requireAuth(request);
    const userId = auth.userId;

    // Find the item first
    const item = await prisma.cartItem.findFirst({
      where: {
        userId,
        OR: (
          [
            cartItemId ? { id: cartItemId } : null,
            productId ? { productId } : null,
          ].filter(Boolean) as { id?: string; productId?: string }[]
        ),
      },
      include: {
        product: true
      }
    });

    if (!item) {
      return errorResponse('Cart item not found', 404);
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: item.id }
      });
      return successResponse(null, 'Item removed from cart');
    }

    if (item.product.stock < quantity) {
      return errorResponse(`Insufficient stock. Only ${item.product.stock} available.`, 400);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
      include: { product: true }
    });

    return successResponse(updatedItem, 'Cart item updated successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to update cart item: ${msg}`, 500);
  }
}

// DELETE: Remove a single cart item OR clear all cart items for user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId');
    const auth = requireAuth(request);
    const userId = auth.userId;

    if (cartItemId) {
      const item = await prisma.cartItem.findFirst({ where: { id: cartItemId, userId } });
      if (!item) return errorResponse('Cart item not found', 404);
      await prisma.cartItem.delete({ where: { id: cartItemId } });
      return successResponse({ deleted: true }, 'Item removed from cart');
    }

    // No cartItemId → clear all
    await prisma.cartItem.deleteMany({ where: { userId } });
    return successResponse(null, 'Cart cleared successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to process cart deletion: ${msg}`, 500);
  }
}
