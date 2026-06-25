/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import type { Product, CartItem, Toast, User } from '../types';
import {
  fetchCart,
  fetchWishlist,
  addToCartApi,
  updateCartApi,
  removeFromCartApi,
  clearCartApi,
  toggleWishlistApi,
  loginApi,
  registerApi,
  fetchCurrentUserApi,
  fetchOrders,
  type ApiCartItem,
} from '../lib/api';

// ─── Map API cart shape → local CartItem shape ────────────────────────────────

function mapApiCart(apiItems: ApiCartItem[]): CartItemWithId[] {
  return apiItems.map((item) => ({
    ...item.product,
    price: Number(item.product.price),
    quantity: item.quantity,
    _cartItemId: item.id,       // the DB CartItem.id (string)
    _apiItemId: item.id,        // alias kept for reference
  }));
}

// Internal CartItem type that carries the DB row id
type CartItemWithId = CartItem & { _cartItemId?: string };

// ─── Context type ─────────────────────────────────────────────────────────────

interface StoreContextType {
  cart: CartItem[];
  wishlist: string[];           // array of productIds (cuid strings)
  toasts: Toast[];
  isDarkMode: boolean;
  isLoadingCart: boolean;
  isLoadingWishlist: boolean;
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoadingUser: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  toggleDarkMode: () => void;
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: number) => void;
  cartTotal: number;
  cartCount: number;
  ordersCount: number;
  refreshOrdersCount: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}

interface StoreProviderProps { children: ReactNode }

export function StoreProvider({ children }: StoreProviderProps) {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [token, setToken]         = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser]           = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [cart, setCart]           = useState<CartItemWithId[]>([]);
  const [wishlist, setWishlist]   = useState<string[]>([]);
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('darkMode') ?? 'false'); }
    catch { return false; }
  });
  const [isLoadingCart, setIsLoadingCart]       = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [ordersCount, setOrdersCount]             = useState(0);

  const refreshOrdersCount = useCallback(() => {
    if (token) {
      fetchOrders()
        .then((items) => setOrdersCount(items.length))
        .catch(() => setOrdersCount(0));
    }
  }, [token]);

  // Raw API cart — lets us resolve CartItem.id for mutations
  const apiCartRef = useRef<ApiCartItem[]>([]);

  // ─── Toasts ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Dark mode ───────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => setIsDarkMode((p) => !p), []);

  // ─── User Profile Bootstrapping ──────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsLoadingUser(true);
      fetchCurrentUserApi()
        .then((userData) => {
          setUser(userData);
        })
        .catch((err) => {
          console.error('Failed to authenticate stored token:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoadingUser(false));
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setIsLoadingUser(false);
    }
  }, [token]);

  // ─── Sync Cart & Wishlist with backend based on User state ────────────────────
  useEffect(() => {
    if (token && user) {
      setIsLoadingCart(true);
      setIsLoadingWishlist(true);

      fetchCart()
        .then((items) => {
          apiCartRef.current = items;
          setCart(mapApiCart(items));
        })
        .catch(() => {
          setCart([]);
        })
        .finally(() => setIsLoadingCart(false));

      fetchWishlist()
        .then((items) => setWishlist(items.map((i) => i.productId)))
        .catch(() => {
          setWishlist([]);
        })
        .finally(() => setIsLoadingWishlist(false));

      refreshOrdersCount();
    } else {
      setCart([]);
      setWishlist([]);
      setOrdersCount(0);
      apiCartRef.current = [];
      setIsLoadingCart(false);
      setIsLoadingWishlist(false);
    }
  }, [token, user, refreshOrdersCount]);

  // ─── Auth Operations ────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const data = await loginApi(credentials);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      showToast(`Welcome back, ${data.user.name || 'User'}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  }, [showToast]);

  const register = useCallback(async (data: { email: string; password: string; name: string }) => {
    try {
      const res = await registerApi(data);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('token', res.token);
      showToast(`Welcome to LuxeStore, ${res.user.name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  }, [showToast]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setCart([]);
    setWishlist([]);
    apiCartRef.current = [];
    localStorage.removeItem('token');
    showToast('Logged out successfully', 'info');
  }, [showToast]);

  // ─── Cart operations ─────────────────────────────────────────────────────────

  const addToCart = useCallback((product: Product) => {
    if (!user) {
      showToast('Please login to add items to your cart', 'error');
      return;
    }
    // Optimistic update
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, price: Number(product.price), quantity: 1 }];
    });
    showToast(`${product.title} added to cart`);

    addToCartApi(product.id, 1)
      .then((newItem) => {
        apiCartRef.current = [
          ...apiCartRef.current.filter((i) => i.productId !== product.id),
          newItem,
        ];
        setCart((prev) =>
          prev.map((item) =>
            item.id === product.id ? { ...item, _cartItemId: newItem.id } : item
          )
        );
      })
      .catch(() => showToast('Failed to sync cart with server', 'error'));
  }, [user, showToast]);

  const removeFromCart = useCallback((productId: string) => {
    const apiItem = apiCartRef.current.find((i) => i.productId === productId);

    // Optimistic
    setCart((prev) => prev.filter((item) => item.id !== productId));
    showToast('Item removed from cart', 'info');

    if (apiItem) {
      apiCartRef.current = apiCartRef.current.filter((i) => i.productId !== productId);
      removeFromCartApi(apiItem.id).catch(() =>
        showToast('Failed to sync removal with server', 'error')
      );
    }
  }, [showToast]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== productId));
      const apiItem = apiCartRef.current.find((i) => i.productId === productId);
      if (apiItem) {
        apiCartRef.current = apiCartRef.current.filter((i) => i.productId !== productId);
        removeFromCartApi(apiItem.id).catch(() => {});
      }
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );

    const apiItem = apiCartRef.current.find((i) => i.productId === productId);
    if (apiItem) {
      updateCartApi(apiItem.id, quantity).catch(() =>
        showToast('Failed to update cart on server', 'error')
      );
    }
  }, [showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
    apiCartRef.current = [];
    showToast('Cart cleared', 'info');
    clearCartApi().catch(() => showToast('Failed to clear cart on server', 'error'));
  }, [showToast]);

  // ─── Wishlist operations ─────────────────────────────────────────────────────

  const toggleWishlist = useCallback((productId: string) => {
    if (!user) {
      showToast('Please login to manage your wishlist', 'error');
      return;
    }
    const isInWishlist = wishlist.includes(productId);

    setWishlist((prev) =>
      isInWishlist ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    showToast(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist', isInWishlist ? 'info' : 'success');

    toggleWishlistApi(productId).catch(() => {
      // Rollback
      setWishlist((prev) =>
        isInWishlist ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
      showToast('Failed to sync wishlist', 'error');
    });
  }, [wishlist, user, showToast]);

  // ─── Derived state ───────────────────────────────────────────────────────────
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  const value: StoreContextType = {
    cart, wishlist, toasts, isDarkMode,
    isLoadingCart, isLoadingWishlist,
    user, token, isAuthenticated, isAdmin, isLoadingUser,
    login, register, logout,
    addToCart, removeFromCart, updateQuantity, clearCart,
    toggleWishlist, toggleDarkMode,
    showToast, removeToast,
    cartTotal, cartCount,
    ordersCount, refreshOrdersCount,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}
