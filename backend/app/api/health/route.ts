import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const productCount = await prisma.product.count();
    return successResponse({
      status: 'ok',
      database: 'connected',
      productCount
    }, 'Server and Database are healthy');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return errorResponse(`Database check failed: ${msg}`, 500);
  }
}
