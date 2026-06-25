import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useStore();
  const shipping = cartTotal > 0 ? 9.99 : 0;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  if (cart.length === 0) {
    return (
      <div className="cart-section cart-page">
        <h2 className="section-title">Shopping Cart</h2>
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything to your cart yet. Start shopping to fill it up!</p>
          <Link to="/" className="hero-btn">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-section cart-page">
      <h2 className="section-title">Shopping Cart ({cart.length} items)</h2>
      <div className="cart-layout">
        <div className="cart-table-wrapper">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="th-price">Price</th>
                <th className="th-qty">Quantity</th>
                <th className="th-price">Total</th>
                <th className="th-remove"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} className="cart-item-row">
                  <td className="cart-item-product">
                    <div className="cart-item-product-inner">
                      <img src={item.image} alt={item.title} className="cart-item-image" />
                      <div className="cart-item-meta">
                        <span className="cart-item-name">{item.title}</span>
                        <span className="cart-item-price">${item.price.toFixed(2)} each</span>
                      </div>
                    </div>
                  </td>
                  <td className="cart-item-total">${item.price.toFixed(2)}</td>
                  <td className="cart-item-qty">
                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="cart-item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="cart-item-remove-cell">
                    <button
                      className="remove-link"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cart-summary">
          <h3 className="summary-title">Order Summary</h3>
          <div className="summary-rows">
            <div className="summary-row">
              <span className="summary-label">Subtotal</span>
              <span className="summary-value">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Shipping</span>
              <span className="summary-value">${shipping.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tax (8%)</span>
              <span className="summary-value">${tax.toFixed(2)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total-row">
              <span className="summary-label">Total</span>
              <span className="summary-value">${total.toFixed(2)}</span>
            </div>
          </div>
          <Link to="/checkout" className="checkout-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Proceed to Checkout →
          </Link>
          <button className="clear-cart-btn" onClick={clearCart}>
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
