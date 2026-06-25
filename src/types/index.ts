export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  brand?: string;
  image: string;
  stock?: number;
  rating: number | { rate: number; count: number };
}

// Normalised rating always returns { rate, count }
export function getRating(product: Product): { rate: number; count: number } {
  if (typeof product.rating === 'object') return product.rating as { rate: number; count: number };
  return { rate: product.rating as number, count: 0 };
}

export interface CartItem extends Omit<Product, 'id'> {
  id: string;
  quantity: number;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface CheckoutFormData {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}
