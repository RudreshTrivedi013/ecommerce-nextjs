import { useState } from 'react';
import type { Product } from '../types';
import { getRating } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

function StockBar({ stock }: { stock: number }) {
  const max = 50;
  const pct = Math.min((stock / max) * 100, 100);
  const color = stock === 0 ? '#ef4444' : stock <= 5 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ marginTop: '6px' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        {stock === 0 ? '🚫 Out of stock' : stock <= 5 ? `⚠️ Only ${stock} left` : `✓ ${stock} in stock`}
      </span>
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginTop: '3px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);
  const isInWishlist = wishlist.includes(product.id);
  const stock = product.stock ?? 99;
  const outOfStock = stock === 0;
  const { rate, count } = getRating(product);

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 800);
  };

  return (
    <div className="product-card" style={{ opacity: outOfStock ? 0.75 : 1 }}>
      <div
        className="product-image-wrapper"
        onClick={() => onViewDetails(product)}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '12px 12px 0 0', zIndex: 2,
          }}>
            <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem', background: '#ef4444', padding: '4px 12px', borderRadius: '999px' }}>
              Out of Stock
            </span>
          </div>
        )}
        <button
          className={`favorite-btn ${isInWishlist ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
          style={{ zIndex: 3 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
        <img src={product.image} alt={product.title} className="product-image" />
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.title}</h3>

        {/* Brand badge */}
        {product.brand && (
          <span style={{
            display: 'inline-block',
            fontSize: '0.7rem',
            fontWeight: '600',
            color: 'var(--accent)',
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            borderRadius: '4px',
            padding: '1px 7px',
            marginBottom: '6px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {product.brand}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', gap: '1px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} width="11" height="11" viewBox="0 0 24 24"
                fill={star <= Math.round(rate) ? '#f59e0b' : 'none'}
                stroke="#f59e0b" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {rate}{count > 0 ? ` (${count})` : ''}
          </span>
        </div>

        <p className="product-price">${Number(product.price).toFixed(2)}</p>

        {/* Stock bar */}
        {product.stock !== undefined && <StockBar stock={stock} />}

        <button
          className={`add-to-cart-btn ${addedAnimation ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={outOfStock}
          style={outOfStock ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--text-muted)', marginTop: '10px' } : { marginTop: '10px' }}
        >
          {outOfStock ? 'Out of Stock' : addedAnimation ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
