import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { ProductCreateSchema } from '@/lib/validators';

// GET: Retrieve a single product by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return errorResponse('Product ID is required', 400);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return errorResponse('Product not found', 404);

    return successResponse(product, 'Product retrieved successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return errorResponse(`Failed to retrieve product: ${msg}`, 500);
  }
}

// PATCH: Update product details (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
    const { id } = params;
    if (!id) return errorResponse('Product ID is required', 400);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return errorResponse('Product not found', 404);

    const body = await request.json();
    const result = ProductCreateSchema.partial().safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.errors[0]?.message || 'Invalid parameters', 400);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: result.data
    });

    return successResponse(updatedProduct, 'Product updated successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    if (msg === 'Forbidden') {
      return errorResponse('Access denied. Administrator privileges required.', 403);
    }
    return errorResponse(`Failed to update product: ${msg}`, 500);
  }
}

// DELETE: Delete a product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
    const { id } = params;
    if (!id) return errorResponse('Product ID is required', 400);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return errorResponse('Product not found', 404);

    await prisma.product.delete({ where: { id } });

    return successResponse(null, 'Product deleted successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    if (msg === 'Forbidden') {
      return errorResponse('Access denied. Administrator privileges required.', 403);
    }
    return errorResponse(`Failed to delete product: ${msg}`, 500);
  }
}
