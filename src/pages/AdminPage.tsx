import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  fetchAdminStatsApi,
  fetchAdminOrdersApi,
  updateOrderStatusApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  fetchProducts,
  type AdminStats,
  type AdminOrder,
} from '../lib/api';
import type { Product } from '../types';

export default function AdminPage() {
  const { user, isAdmin, isLoadingUser, showToast } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders'>('stats');
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modals & Form states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: '',
  });

  // Verify Admin Access
  useEffect(() => {
    if (!isLoadingUser) {
      if (!user || !isAdmin) {
        showToast('Access denied. Administrators only.', 'error');
        navigate('/');
      }
    }
  }, [user, isAdmin, isLoadingUser, navigate, showToast]);

  // Load Tab Data
  const loadData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      if (activeTab === 'stats') {
        const statsData = await fetchAdminStatsApi();
        setStats(statsData);
      } else if (activeTab === 'orders') {
        const ordersData = await fetchAdminOrdersApi();
        setOrders(ordersData);
      } else if (activeTab === 'products') {
        const res = await fetchProducts({ limit: 100 });
        setProducts(res.products);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load administration data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, user, isAdmin]);

  if (isLoadingUser || !user || !isAdmin) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Verifying admin credentials...</p>
      </div>
    );
  }

  // --- CRUD Handlers ---
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      price: '',
      category: '',
      image: '',
      stock: '',
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      category: product.category,
      image: product.image,
      stock: String(product.stock ?? 0),
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price || !productForm.category || !productForm.image) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const parsedData = {
        title: productForm.title,
        description: productForm.description,
        price: Number(productForm.price),
        category: productForm.category.toLowerCase(),
        image: productForm.image,
        stock: Number(productForm.stock || 0),
      };

      if (editingProduct) {
        await updateProductApi(editingProduct.id, parsedData);
        showToast('Product updated successfully!');
      } else {
        await createProductApi(parsedData);
        showToast('Product added successfully!');
      }
      setShowProductModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsActionLoading(true);
    try {
      await deleteProductApi(productToDelete.id);
      showToast('Product deleted successfully');
      setProductToDelete(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatusApi(orderId, newStatus);
      showToast(`Order status updated to ${newStatus}`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  return (
    <div style={styles.page}>
      {/* Sidebar / Top Nav */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Management Console</h1>
          <p style={styles.subtitle}>Welcome back, Administrator</p>
        </div>
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('stats')}
            style={{ ...styles.tabButton, ...(activeTab === 'stats' ? styles.tabButtonActive : {}) }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{ ...styles.tabButton, ...(activeTab === 'products' ? styles.tabButtonActive : {}) }}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{ ...styles.tabButton, ...(activeTab === 'orders' ? styles.tabButtonActive : {}) }}
          >
            Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={styles.content}>
        {isLoading ? (
          <div style={styles.loadingSpinnerContainer}>
            <div style={styles.spinner}></div>
          </div>
        ) : (
          <>
            {/* 1. STATS TAB */}
            {activeTab === 'stats' && stats && (
              <div style={styles.tabContent}>
                {/* Stats grid */}
                <div style={styles.grid}>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Total Revenue</span>
                    <span style={styles.cardValue}>${stats.revenue.toFixed(2)}</span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Total Orders</span>
                    <span style={styles.cardValue}>{stats.ordersCount}</span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Registered Customers</span>
                    <span style={styles.cardValue}>{stats.usersCount}</span>
                  </div>
                  <div style={styles.card}>
                    <span style={styles.cardLabel}>Low Stock Warnings</span>
                    <span style={{ ...styles.cardValue, ...(stats.lowStockCount > 0 ? { color: '#fb923c' } : {}) }}>
                      {stats.lowStockCount}
                    </span>
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div style={styles.panel}>
                  <h3 style={styles.panelTitle}>Recent Activity</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Order ID</th>
                          <th style={styles.th}>Customer</th>
                          <th style={styles.th}>Placed At</th>
                          <th style={styles.th}>Total</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={styles.tdEmpty}>No orders placed yet.</td>
                          </tr>
                        ) : (
                          stats.recentOrders.map((order) => (
                            <tr key={order.id} style={styles.tr}>
                              <td style={{ ...styles.td, fontFamily: 'monospace' }}>#{order.id.slice(-6)}</td>
                              <td style={styles.td}>
                                <div>{order.userName}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{order.userEmail}</div>
                              </td>
                              <td style={styles.td}>{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td style={{ ...styles.td, fontWeight: '600' }}>${order.total.toFixed(2)}</td>
                              <td style={styles.td}>
                                <span style={{ ...styles.badge, ...getStatusBadgeStyle(order.status) }}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div style={styles.tabContent}>
                <div style={styles.actionHeader}>
                  <h3 style={styles.panelTitle}>Product Inventory</h3>
                  <button onClick={handleOpenAddModal} style={styles.primaryButton}>
                    + Add New Product
                  </button>
                </div>

                <div style={styles.panel}>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Product</th>
                          <th style={styles.th}>Category</th>
                          <th style={styles.th}>Price</th>
                          <th style={styles.th}>Stock</th>
                          <th style={styles.th}>Rating</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} style={styles.tr}>
                            <td style={{ ...styles.td, display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={p.image} alt={p.title} style={styles.thumbnail} />
                              <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: '600' }}>{p.title}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{p.id}</div>
                              </div>
                            </td>
                            <td style={{ ...styles.td, textTransform: 'capitalize' }}>{p.category}</td>
                            <td style={{ ...styles.td, fontWeight: '600' }}>${Number(p.price).toFixed(2)}</td>
                            <td style={styles.td}>
                              <span style={{
                                fontWeight: '600',
                                color: (p.stock ?? 0) <= 5 ? '#f97316' : (p.stock ?? 0) === 0 ? '#ef4444' : '#10b981'
                              }}>
                                {p.stock ?? 0} units
                              </span>
                            </td>
                            <td style={styles.td}>★ {typeof p.rating === 'object' ? p.rating.rate : p.rating}</td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOpenEditModal(p)} style={styles.editButton}>Edit</button>
                                <button onClick={() => setProductToDelete(p)} style={styles.deleteButton}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div style={styles.tabContent}>
                <h3 style={styles.panelTitle}>All Customer Orders</h3>
                
                <div style={styles.panel}>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Order ID</th>
                          <th style={styles.th}>Customer Details</th>
                          <th style={styles.th}>Items Ordered</th>
                          <th style={styles.th}>Fulfillment Status</th>
                          <th style={styles.th}>Grand Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={styles.tdEmpty}>No orders placed yet.</td>
                          </tr>
                        ) : (
                          orders.map((order) => (
                            <tr key={order.id} style={styles.tr}>
                              <td style={{ ...styles.td, fontFamily: 'monospace' }}>#{order.id.slice(-6)}</td>
                              <td style={styles.td}>
                                <div>{order.user.name || 'Anonymous'}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{order.user.email}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                  {new Date(order.createdAt).toLocaleString()}
                                </div>
                              </td>
                              <td style={styles.td}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {order.items.map((item) => (
                                    <div key={item.id} style={{ fontSize: '13px' }}>
                                      {item.product?.title || 'Unknown Product'} <span style={{ color: '#94a3b8' }}>x{item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td style={styles.td}>
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  style={{
                                    ...styles.select,
                                    ...getStatusBadgeStyle(order.status)
                                  }}
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="PROCESSING">PROCESSING</option>
                                  <option value="SHIPPED">SHIPPED</option>
                                  <option value="COMPLETED">COMPLETED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </td>
                              <td style={{ ...styles.td, fontWeight: '600', fontSize: '15px' }}>
                                ${Number(order.total).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- ADD/EDIT PRODUCT MODAL --- */}
      {showProductModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowProductModal(false)} style={styles.modalClose}>×</button>
            </div>
            
            <form onSubmit={handleSaveProduct} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Title *</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="electronics, clothing, home..."
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    style={styles.modalInput}
                  />
                </div>
                <div style={{ ...styles.formGroup, width: '120px' }}>
                  <label style={styles.formLabel}>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    style={styles.modalInput}
                  />
                </div>
                <div style={{ ...styles.formGroup, width: '120px' }}>
                  <label style={styles.formLabel}>Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    style={styles.modalInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Image URL *</label>
                <input
                  type="url"
                  required
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <textarea
                  rows={4}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={styles.modalTextarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowProductModal(false)} style={styles.secondaryButton}>
                  Cancel
                </button>
                <button type="submit" disabled={isActionLoading} style={styles.primaryButton}>
                  {isActionLoading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {productToDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModalContent}>
            <div style={styles.confirmModalHeader}>
              <h3 style={styles.confirmModalTitle}>Confirm Deletion</h3>
              <button onClick={() => setProductToDelete(null)} style={styles.modalClose}>×</button>
            </div>
            <div style={styles.confirmModalBody}>
              <div style={styles.warningIcon}>⚠️</div>
              <p style={styles.confirmText}>
                Are you sure you want to delete <strong>{productToDelete.title}</strong>?
              </p>
              <p style={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div style={styles.modalActions}>
              <button 
                type="button" 
                onClick={() => setProductToDelete(null)} 
                style={styles.secondaryButton}
                disabled={isActionLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteProduct} 
                style={styles.dangerButton}
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
const getStatusBadgeStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'COMPLETED':
      return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' };
    case 'SHIPPED':
      return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' };
    case 'PROCESSING':
      return { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.2)' };
    case 'PENDING':
      return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' };
    case 'CANCELLED':
      return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' };
    default:
      return {};
  }
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '40px max(4%, 24px)',
    background: '#0a0a0f',
    minHeight: 'calc(100vh - 80px)',
    color: '#f1f5f9',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  },
  loadingSpinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px',
    marginBottom: '36px',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px',
  },
  tabContainer: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '4px',
  },
  tabButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.15s ease',
  },
  tabButtonActive: {
    background: '#1e293b',
    color: '#fff',
  },
  content: {
    marginTop: '20px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '24px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  panel: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '24px',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '20px',
    color: '#f8fafc',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e293b',
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: '13px',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#cbd5e1',
    verticalAlign: 'middle',
  },
  tdEmpty: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748b',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  thumbnail: {
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    objectFit: 'cover',
    background: '#1e293b',
  },
  primaryButton: {
    padding: '10px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.15s ease',
  },
  secondaryButton: {
    padding: '10px 16px',
    background: '#1e293b',
    color: '#cbd5e1',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
  },
  editButton: {
    padding: '6px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#cbd5e1',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  deleteButton: {
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  select: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid transparent',
    background: '#1e293b',
    color: '#fff',
    outline: 'none',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '16px',
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#0f0f16',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    maxWidth: '560px',
    width: '100%',
    padding: '24px 32px',
    maxHeight: '90vh',
    overflowY: 'auto',
    color: '#fff',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '28px',
    cursor: 'pointer',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  modalInput: {
    padding: '10px 14px',
    borderRadius: '6px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid #1e293b',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  modalTextarea: {
    padding: '10px 14px',
    borderRadius: '6px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid #1e293b',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #1e293b',
    paddingTop: '20px',
    marginTop: '10px',
  },
  dangerButton: {
    padding: '10px 16px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.15s ease',
  },
  confirmModalContent: {
    backgroundColor: '#0f0f16',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    maxWidth: '440px',
    width: '100%',
    padding: '24px 32px',
    maxHeight: '90vh',
    overflowY: 'auto',
    color: '#fff',
    textAlign: 'center',
  },
  confirmModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  confirmModalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ef4444',
  },
  confirmModalBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 0',
  },
  warningIcon: {
    fontSize: '48px',
    color: '#ef4444',
    marginBottom: '8px',
  },
  confirmText: {
    fontSize: '16px',
    color: '#f8fafc',
    margin: 0,
    lineHeight: '1.5',
  },
  warningText: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
};
