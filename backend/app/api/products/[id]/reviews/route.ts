import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ReviewSchema } from '@/lib/validators';

// GET: Fetch all reviews for a specific product
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) return errorResponse('Product ID is required', 400);

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    return successResponse(reviews, 'Reviews retrieved successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return errorResponse(`Failed to retrieve reviews: ${msg}`, 500);
  }
}

// POST: Add or update a product review, and recalculate average rating
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) return errorResponse('Product ID is required', 400);

    const auth = requireAuth(request);
    const userId = auth.userId;

    const body = await request.json();
    const result = ReviewSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.errors[0]?.message || 'Invalid parameters', 400);
    }

    const { rating, comment } = result.data;

    const productExists = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!productExists) {
      return errorResponse('Product not found', 404);
    }

    // Check if user already left a review
    const existingReview = await prisma.review.findFirst({
      where: { userId, productId }
    });

    let review;
    if (existingReview) {
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: { rating, comment }
      });
    } else {
      review = await prisma.review.create({
        data: {
          userId,
          productId,
          rating,
          comment
        }
      });
    }

    // Recalculate average product rating
    const allReviews = await prisma.review.findMany({
      where: { productId }
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const normalizedRating = Number(averageRating.toFixed(1));

    await prisma.product.update({
      where: { id: productId },
      data: { rating: normalizedRating }
    });

    return successResponse(review, 'Review submitted successfully', 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(`Failed to submit review: ${msg}`, 500);
  }
}
