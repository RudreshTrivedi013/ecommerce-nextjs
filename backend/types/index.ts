import { User, Product, CartItem, Wishlist, Order, OrderItem } from '@prisma/client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface WishlistWithProduct extends Wishlist {
  product: Product;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}
