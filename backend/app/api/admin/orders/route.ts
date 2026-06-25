import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// GET: Retrieve all orders in the system with their items and user details
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return successResponse(orders, 'All orders retrieved successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    if (msg === 'Forbidden') {
      return errorResponse('Access denied. Administrator privileges required.', 403);
    }
    return errorResponse(`Failed to retrieve orders: ${msg}`, 500);
  }
}

// PATCH: Update status of a specific order
export async function PATCH(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return errorResponse('orderId and status are required', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return successResponse(updatedOrder, `Order status updated to ${status}`);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    if (msg === 'Forbidden') {
      return errorResponse('Access denied. Administrator privileges required.', 403);
    }
    return errorResponse(`Failed to update order status: ${msg}`, 500);
  }
}
