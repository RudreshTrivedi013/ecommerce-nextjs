import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders, type ApiOrder } from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981', // curated emerald green
  PENDING: '#f59e0b',   // warm amber
  CANCELLED: '#ef4444', // red
  PROCESSING: '#3b82f6', // blue
};

const STATUS_ICONS: Record<string, string> = {
  COMPLETED: '✨',
  PENDING: '⏳',
  CANCELLED: '❌',
  PROCESSING: '🔄',
};

function OrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders. Is the backend running?'))
      .finally(() => setIsLoading(false));
  }, []);

  // Calculate summary stats (from ALL orders, regardless of filter)
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalItems = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  // Filter and Sort orders
  const filteredOrders = orders
    .filter(
      (order) =>
        statusFilter === 'ALL' ||
        order.status.toUpperCase() === statusFilter.toUpperCase()
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });

  if (isLoading) {
    return (
      <div className="cart-section cart-page">
        <h2 className="section-title">My Orders</h2>
        <div className="empty-state">
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
          <h3>Loading orders…</h3>
          <p>Fetching your order history</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-section cart-page">
        <h2 className="section-title">My Orders</h2>
        <div className="empty-state">
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
          <h3>Could not load orders</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="cart-section cart-page">
        <h2 className="section-title">My Orders</h2>
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
          <h3>No orders yet</h3>
          <p>You haven't placed any orders. Start shopping to see your history here!</p>
          <Link to="/" className="hero-btn" style={{ display: 'inline-block', marginTop: '20px' }}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-section cart-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '32px' }}>My Orders</h2>

      {/* Summary stats bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{totalOrders}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>${totalSpent.toFixed(2)}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛒</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Bought</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{totalItems}</div>
        </div>
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px 20px',
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid ' + (isActive ? 'var(--accent)' : 'var(--border)'),
                  background: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'NEWEST' | 'OLDEST')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="empty-state" style={{ padding: '48px 24px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>No matching orders</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders found with status "{statusFilter.toLowerCase()}"</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const statusColor = STATUS_COLORS[order.status.toUpperCase()] ?? '#6b7280';
            const statusIcon = STATUS_ICONS[order.status.toUpperCase()] ?? '📋';
            const date = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            });
            const time = new Date(order.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="checkout-card"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isExpanded ? '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {/* Order header button */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px',
                    background: 'var(--surface)',
                    border: 'none',
                    cursor: 'pointer',
                    gap: '16px',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>{statusIcon}</div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        Order #{order.id}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {date} at {time}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: `${statusColor}15`,
                        color: statusColor,
                        border: `1px solid ${statusColor}30`,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {order.status.toUpperCase()}
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontWeight: '800', fontSize: '1.15rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                      ${Number(order.total).toFixed(2)}
                    </div>
                    <div style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                    }}>
                      ▼
                    </div>
                  </div>
                </button>

                {/* Order items (expandable block) */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '24px',
                    background: 'var(--bg)',
                    animation: 'fadeIn 0.25s ease-out',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '14px',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            transition: 'transform 0.2s, border-color 0.2s',
                          }}
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid var(--border)' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.92rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.product.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ textTransform: 'capitalize' }}>{item.product.category}</span>
                              {item.product.brand && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{item.product.brand}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '1rem' }}>
                              ${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              ${Number(item.priceAtPurchase).toFixed(2)} each
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order total summary */}
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Order Total</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)' }}>
                          ${Number(order.total).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link to="/" className="hero-btn" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '12px', fontSize: '0.95rem' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrdersPage;
