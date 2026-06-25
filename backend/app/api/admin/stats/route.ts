import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const [
      orders,
      userCount,
      productCount,
      lowStockProducts,
      recentOrders
    ] = await Promise.all([
      prisma.order.findMany({}),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.product.count({}),
      prisma.product.findMany({ where: { stock: { lte: 5 } } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

    return successResponse({
      revenue: Number(totalRevenue.toFixed(2)),
      ordersCount: orders.length,
      usersCount: userCount,
      productsCount: productCount,
      lowStockCount: lowStockProducts.length,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        userEmail: order.user.email,
        userName: order.user.name || 'Anonymous',
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt
      }))
    }, 'Admin stats retrieved successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    if (msg === 'Forbidden') {
      return errorResponse('Access denied. Administrator privileges required.', 403);
    }
    return errorResponse(`Failed to retrieve stats: ${msg}`, 500);
  }
}
