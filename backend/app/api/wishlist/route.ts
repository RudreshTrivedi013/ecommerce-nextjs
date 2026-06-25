import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET: Retrieve all wishlist items joined with product details
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const userId = auth.userId;

    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: true
      }
    });
    return successResponse(wishlist, 'Wishlist retrieved successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to retrieve wishlist: ${msg}`, 500);
  }
}

// POST: Toggle wishlist item (Add if absent, Remove if present)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;
    if (!productId) {
      return errorResponse('productId is required', 400);
    }

    const auth = requireAuth(request);
    const userId = auth.userId;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id }
      });
      return successResponse({ active: false }, 'Product removed from wishlist');
    } else {
      const newItem = await prisma.wishlist.create({
        data: { userId, productId },
        include: { product: true }
      });
      return successResponse({ active: true, item: newItem }, 'Product added to wishlist', 201);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to toggle wishlist: ${msg}`, 500);
  }
}

// DELETE: Explicitly remove product from wishlist via query param
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return errorResponse('productId query parameter is required', 400);
    }

    const auth = requireAuth(request);
    const userId = auth.userId;

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (!existing) {
      return errorResponse('Wishlist item not found', 404);
    }

    await prisma.wishlist.delete({
      where: { id: existing.id }
    });

    return successResponse(null, 'Product removed from wishlist');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to remove from wishlist: ${msg}`, 500);
  }
}
