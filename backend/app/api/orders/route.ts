import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET: Fetch order history for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const userId = auth.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
    return successResponse(orders, 'Orders retrieved successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to retrieve orders: ${msg}`, 500);
  }
}

// POST: Place a new order, update product inventory, and clear user's cart
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const userId = auth.userId;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      return errorResponse('Cannot place an order with an empty cart', 400);
    }

    // Verify stock levels for all products
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return errorResponse(`Insufficient stock for "${item.product.title}". Available: ${item.product.stock}, requested: ${item.quantity}`, 400);
      }
    }

    const totalAmount = cartItems.reduce((acc, item) => {
      return acc + (Number(item.product.price) * item.quantity);
    }, 0);

    // Atomically execute order creation, item lines creation, stock reduction, and cart clear
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the Order record
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: 'PENDING', // Default to PENDING instead of COMPLETED so admin can process/complete it
          total: totalAmount,
        }
      });

      // 2. Process order items & adjust product inventory levels
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          }
        });

        // Decrement available stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // 3. Clear user's active cart
      await tx.cartItem.deleteMany({
        where: { userId }
      });

      return newOrder;
    });

    // Fetch the fully built order with associations for client response
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return successResponse(completeOrder, 'Order placed successfully', 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to place order: ${msg}`, 500);
  }
}
