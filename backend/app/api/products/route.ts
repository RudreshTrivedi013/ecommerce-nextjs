import { NextRequest } from 'next/server';
import { ProductFilterSchema, ProductCreateSchema } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/utils/response';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// GET: Filtered products list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw: Record<string, unknown> = {};

    // Category filter
    const cat = searchParams.get('category');
    if (cat && cat !== 'all' && cat !== 'wishlist') raw.category = cat;

    // Full-text search
    const search = searchParams.get('search') ?? searchParams.get('q');
    if (search) raw.q = search;

    // Brand filter
    const brandParam = searchParams.get('brand');
    if (brandParam && brandParam !== 'all') raw.brand = brandParam;

    // Sorting
    const sortBy = searchParams.get('sortBy') ?? searchParams.get('sort');
    if (sortBy && sortBy !== 'default') {
      if (sortBy === 'price_asc'  || sortBy === 'price-low')  { raw.sort = 'price'; raw.order = 'asc';  }
      else if (sortBy === 'price_desc' || sortBy === 'price-high') { raw.sort = 'price'; raw.order = 'desc'; }
      else if (sortBy === 'rating_desc' || sortBy === 'rating')    { raw.sort = 'rating'; raw.order = 'desc'; }
    }

    // Pagination
    if (searchParams.has('page'))  raw.page  = searchParams.get('page');
    if (searchParams.has('limit')) raw.limit = searchParams.get('limit');

    // Price & rating range filters
    if (searchParams.has('minPrice'))  raw.minPrice  = searchParams.get('minPrice');
    if (searchParams.has('maxPrice'))  raw.maxPrice  = searchParams.get('maxPrice');
    if (searchParams.has('minRating')) raw.minRating = searchParams.get('minRating');

    const result = ProductFilterSchema.safeParse(raw);
    if (!result.success) {
      return errorResponse(result.error.errors[0]?.message || 'Invalid parameters', 400);
    }

    const { category, q, brand, sort, order, page, limit, minPrice, maxPrice, minRating } = result.data;

    const where: Record<string, unknown> = {};

    if (category) where.category = category;
    if (brand) where.brand = { equals: brand, mode: 'insensitive' };

    if (q) {
      where.OR = [
        { title:       { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand:       { contains: q, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return successResponse({ products, total, page, totalPages }, 'Products retrieved successfully');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return errorResponse(`Failed to retrieve products: ${msg}`, 500);
  }
}

// POST: Create a new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const result = ProductCreateSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.errors[0]?.message || 'Invalid product parameters', 400);
    }

    const { title, description, price, category, brand, image, stock } = result.data;

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        category,
        brand: brand ?? null,
        image,
        stock,
        rating: 0.0 // New products start with no ratings
      }
    });

    return successResponse(product, 'Product created successfully', 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return errorResponse('Authentication required', 401);
    }
    if (msg === 'Forbidden') {
      return errorResponse('Access denied. Administrator privileges required.', 403);
    }
    return errorResponse(`Failed to create product: ${msg}`, 500);
  }
}
