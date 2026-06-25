/**
 * LuxeStore API Client
 * All requests are proxied via Vite to http://localhost:3001
 */

import type { Product, User, Review } from '../types';

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });
  
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `API error: ${res.status}`);
  }
  return json.data as T;
}

// ─── Authentication ───────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

export async function loginApi(credentials: { email: string; password: string }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerApi(data: { email: string; password: string; name: string }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchCurrentUserApi(): Promise<User> {
  return apiFetch<User>('/api/auth/me');
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductsQuery {
  search?: string;
  category?: string;
  brand?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'default';
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchProducts(query: ProductsQuery = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (query.search)                        params.set('search', query.search);
  if (query.category && query.category !== 'all') params.set('category', query.category);
  if (query.brand && query.brand !== 'all')       params.set('brand', query.brand);
  if (query.sortBy && query.sortBy !== 'default') params.set('sortBy', query.sortBy);
  if (query.page)                          params.set('page', String(query.page));
  if (query.limit)                         params.set('limit', String(query.limit));
  if (query.minPrice !== undefined)        params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined)        params.set('maxPrice', String(query.maxPrice));
  if (query.minRating !== undefined)       params.set('minRating', String(query.minRating));

  return apiFetch<ProductsResponse>(`/api/products?${params.toString()}`);
}

export async function fetchProductById(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`);
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function fetchProductReviewsApi(productId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/api/products/${productId}/reviews`);
}

export async function submitProductReviewApi(productId: string, data: { rating: number; comment: string }): Promise<Review> {
  return apiFetch<Review>(`/api/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface ApiCartItem {
  id: string;          // DB CartItem.id (cuid)
  productId: string;
  quantity: number;
  product: Product;
}

export async function fetchCart(): Promise<ApiCartItem[]> {
  return apiFetch<ApiCartItem[]>('/api/cart');
}

export async function addToCartApi(productId: string, quantity = 1): Promise<ApiCartItem> {
  return apiFetch<ApiCartItem>('/api/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartApi(cartItemId: string, quantity: number): Promise<ApiCartItem> {
  return apiFetch<ApiCartItem>('/api/cart', {
    method: 'PATCH',
    body: JSON.stringify({ cartItemId, quantity }),
  });
}

export async function removeFromCartApi(cartItemId: string): Promise<void> {
  await apiFetch<{ deleted: boolean }>(`/api/cart?cartItemId=${cartItemId}`, {
    method: 'DELETE',
  });
}

export async function clearCartApi(): Promise<void> {
  await apiFetch<null>('/api/cart', { method: 'DELETE' });
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface ApiWishlistItem {
  id: string;
  productId: string;
  product: Product;
}

export async function fetchWishlist(): Promise<ApiWishlistItem[]> {
  return apiFetch<ApiWishlistItem[]>('/api/wishlist');
}

export async function toggleWishlistApi(productId: string): Promise<{ action: 'added' | 'removed' }> {
  return apiFetch<{ action: 'added' | 'removed' }>('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface ApiOrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: Product;
}

export interface ApiOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: ApiOrderItem[];
}

export async function fetchOrders(): Promise<ApiOrder[]> {
  return apiFetch<ApiOrder[]>('/api/orders');
}

export async function placeOrder(): Promise<ApiOrder> {
  return apiFetch<ApiOrder>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export interface AdminStats {
  revenue: number;
  ordersCount: number;
  usersCount: number;
  productsCount: number;
  lowStockCount: number;
  recentOrders: {
    id: string;
    userEmail: string;
    userName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
}

export async function fetchAdminStatsApi(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/api/admin/stats');
}

export interface AdminOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  items: {
    id: string;
    productId: string;
    quantity: number;
    priceAtPurchase: number;
    product: Product;
  }[];
}

export async function fetchAdminOrdersApi(): Promise<AdminOrder[]> {
  return apiFetch<AdminOrder[]>('/api/admin/orders');
}

export async function updateOrderStatusApi(orderId: string, status: string): Promise<AdminOrder> {
  return apiFetch<AdminOrder>('/api/admin/orders', {
    method: 'PATCH',
    body: JSON.stringify({ orderId, status }),
  });
}

export async function createProductApi(productData: Omit<Product, 'id' | 'rating'>): Promise<Product> {
  return apiFetch<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}

export async function updateProductApi(productId: string, productData: Partial<Omit<Product, 'id' | 'rating'>>): Promise<Product> {
  return apiFetch<Product>(`/api/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(productData),
  });
}

export async function deleteProductApi(productId: string): Promise<void> {
  await apiFetch<null>(`/api/products/${productId}`, {
    method: 'DELETE',
  });
}
