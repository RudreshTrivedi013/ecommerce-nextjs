import { useState, useEffect } from 'react';
import type { Product, Review } from '../types';
import { useStore } from '../context/StoreContext';
import { fetchProductReviewsApi, submitProductReviewApi } from '../lib/api';

interface ProductModalProps {
  product: Product;
  isInWishlist: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (id: string) => void;
}

function StarRating({ rate, count }: { rate: number; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} width="16" height="16" viewBox="0 0 24 24"
            fill={star <= Math.round(rate) ? '#f59e0b' : 'none'}
            stroke="#f59e0b" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
        {rate}/5{count > 0 ? ` · ${count} reviews` : ''}
      </span>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const color = stock === 0 ? '#ef4444' : stock <= 5 ? '#f59e0b' : '#22c55e';
  const label = stock === 0 ? '🚫 Out of Stock' : stock <= 5 ? `⚠️ Only ${stock} left` : `✅ ${stock} in stock`;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 12px', borderRadius: '999px',
      background: `${color}18`, border: `1px solid ${color}44`,
      fontSize: '0.82rem', fontWeight: '600', color,
    }}>
      {label}
    </div>
  );
}

function ProductModal({ product, isInWishlist, onClose, onAddToCart, onToggleWishlist }: ProductModalProps) {
  const { user } = useStore();
  const [added, setAdded] = useState(false);
  const stock = product.stock ?? 99;
  const outOfStock = stock === 0;

  // Reviews states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoadingReviews(true);
    fetchProductReviewsApi(product.id)
      .then(setReviews)
      .catch((err) => console.error('Failed to fetch reviews:', err))
      .finally(() => setIsLoadingReviews(false));
  }, [product.id]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAddToCart = () => {
    if (outOfStock) return;
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const savedReview = await submitProductReviewApi(product.id, {
        rating: newRating,
        comment: newComment,
      });

      // Update reviews local list
      setReviews((prev) => {
        const exists = prev.find((r) => r.userId === user?.id);
        const hydratedReview = {
          ...savedReview,
          user: {
            name: user?.name || 'Anonymous',
            email: user?.email || '',
          },
        };
        if (exists) {
          return prev.map((r) => (r.userId === user?.id ? hydratedReview : r));
        }
        return [hydratedReview, ...prev];
      });

      setNewComment('');
      setNewRating(5);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derive dynamic ratings inside the modal
  const totalReviews = reviews.length;
  const averageRate = totalReviews > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : (typeof product.rating === 'object' ? product.rating.rate : product.rating);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth: '820px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Main Info Section */}
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div className="modal-left" style={{ flex: '1 1 300px' }}>
              <div className="modal-image-wrapper">
                <img src={product.image} alt={product.title} className="modal-image" />
              </div>
            </div>
            <div className="modal-right" style={{ flex: '1 1 350px' }}>
              <span className="modal-category">{product.category}</span>
              <h2 className="modal-title">{product.title}</h2>

              <StarRating rate={averageRate} count={totalReviews} />
              <p className="modal-price">${Number(product.price).toFixed(2)}</p>

              {product.stock !== undefined && (
                <div style={{ marginBottom: '16px' }}>
                  <StockBadge stock={stock} />
                </div>
              )}

              <p className="modal-description">{product.description}</p>

              <div className="modal-specs">
                <h4 className="specs-title">Details</h4>
                <div className="specs-grid">
                  <div className="spec-row">
                    <span className="spec-label">Category:</span>
                    <span className="spec-value" style={{ textTransform: 'capitalize' }}>{product.category}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Rating:</span>
                    <span className="spec-value">⭐ {averageRate} / 5</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Stock Status:</span>
                    <span className="spec-value">
                      {stock === 0 ? 'Out of stock' : `${stock} units available`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className={`modal-add-btn ${added ? 'added' : ''}`}
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  style={outOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                  {outOfStock ? 'Out of Stock' : added ? '✓ Added to Cart!' : 'Add to Cart'}
                </button>
                <button
                  className={`modal-fav-btn ${isInWishlist ? 'active' : ''}`}
                  onClick={() => onToggleWishlist(product.id)}
                  title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '0' }} />

          {/* Reviews Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>Customer Reviews</h3>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              
              {/* Left Side: Reviews List */}
              <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isLoadingReviews ? (
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                    No reviews yet. Be the first to review this product!
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#cbd5e1' }}>
                          {review.user?.name || review.user?.email || 'Anonymous'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Review Rating Stars */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} width="12" height="12" viewBox="0 0 24 24"
                            fill={star <= review.rating ? '#f59e0b' : 'none'}
                            stroke="#f59e0b" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>

                      <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '4px 0 0 0' }}>
                        {review.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Right Side: Add/Edit Review Form */}
              <div style={{ flex: '1 1 280px' }}>
                {user ? (
                  <div
                    style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                    }}
                  >
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc', margin: '0 0 12px 0' }}>
                      {reviews.find((r) => r.userId === user.id) ? 'Edit Your Review' : 'Write a Review'}
                    </h4>
                    
                    <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Rating selection */}
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Rating
                        </label>
                        <div style={{ display: 'flex', gap: '4px', margin: '6px 0' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              onClick={() => setNewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(null)}
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill={star <= (hoverRating ?? newRating) ? '#f59e0b' : 'none'}
                              stroke="#f59e0b"
                              strokeWidth="2"
                              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      {/* Comment textarea */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Comments
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="What did you think of the quality, fit, and design?"
                          style={{
                            padding: '10px 12px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            resize: 'vertical',
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        style={{
                          padding: '10px',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          marginTop: '6px',
                          opacity: isSubmitting || !newComment.trim() ? 0.6 : 1,
                        }}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                      Sign in to share your thoughts on this product.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductModal;
