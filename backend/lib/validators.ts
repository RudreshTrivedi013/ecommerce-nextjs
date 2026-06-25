import { z } from 'zod';

export const ProductFilterSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  brand: z.string().optional(),
  sort: z.enum(['price', 'rating', 'title']).default('title'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

export const AddToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const UpdateQuantitySchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

export type ProductFilterInput = z.infer<typeof ProductFilterSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateQuantityInput = z.infer<typeof UpdateQuantitySchema>;

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1, 'Comment cannot be empty'),
});

export const ProductCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  image: z.string().url('Image must be a valid URL'),
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ReviewInput = z.infer<typeof ReviewSchema>;
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
