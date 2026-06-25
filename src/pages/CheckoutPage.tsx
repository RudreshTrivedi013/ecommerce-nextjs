import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { placeOrder } from '../lib/api';
import type { CheckoutFormData, FormErrors } from '../types';

function CheckoutPage() {
  const { cart, cartTotal, clearCart, showToast, isLoadingCart, refreshOrdersCount } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<CheckoutFormData>({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const shipping = cartTotal > 0 ? 9.99 : 0;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  // ─── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = 'Valid email is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.zipCode.trim() || !/^\d{5,6}$/.test(form.zipCode))
      newErrors.zipCode = 'Valid ZIP code is required';
    if (!form.cardNumber.replace(/\s/g, '') || form.cardNumber.replace(/\s/g, '').length < 16)
      newErrors.cardNumber = 'Valid card number is required (16 digits)';
    if (!form.expiry || !/^\d{2}\/\d{2}$/.test(form.expiry))
      newErrors.expiry = 'Expiry in MM/YY format is required';
    if (!form.cvv || !/^\d{3,4}$/.test(form.cvv))
      newErrors.cvv = 'Valid CVV is required (3-4 digits)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function formatCardNumber(value: string) {
    return value
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleCardInput(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }));
    if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: '' }));
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function handleExpiryInput(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, expiry: formatExpiry(e.target.value) }));
    if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: '' }));
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const order = await placeOrder();

      setOrderId(order.id);
      setOrderPlaced(true);
      clearCart();
      refreshOrdersCount();
      showToast(`Order #${order.id} placed successfully! 🎉`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Order success screen ──────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="cart-section cart-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="checkout-card" style={{ textAlign: 'center', padding: '48px 32px', maxWidth: '500px', width: '100%' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Order Confirmed!
          </h2>
          {orderId && (
            <p style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '1.1rem', marginBottom: '12px' }}>
              Order #{orderId}
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
            Thank you, {form.fullName}! Your order has been saved to our database and will be processed shortly.
          </p>
          <button
            className="hero-btn"
            onClick={() => navigate('/')}
            style={{ display: 'inline-block', cursor: 'pointer' }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty cart ────────────────────────────────────────────────────────────
  if (!isLoadingCart && cart.length === 0) {
    return (
      <div className="cart-section cart-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="checkout-card" style={{ textAlign: 'center', padding: '48px 32px', maxWidth: '500px', width: '100%' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛒</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Your cart is empty
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
            Add some products to your cart before checking out.
          </p>
          <Link to="/" className="hero-btn" style={{ display: 'inline-block' }}>
            Back to Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main checkout form ────────────────────────────────────────────────────
  return (
    <div className="cart-section cart-page">
      <h2 className="section-title">Checkout</h2>
      <form onSubmit={handleSubmit} className="cart-layout" noValidate>
        {/* Left: form fields */}
        <div className="cart-table-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Shipping info */}
          <div className="checkout-card" style={{ padding: '28px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              📦 Shipping Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} placeholder="John Doe" style={{ gridColumn: '1 / -1' }} />
              <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="john@example.com" style={{ gridColumn: '1 / -1' }} />
              <FormField label="Address" name="address" value={form.address} onChange={handleChange} error={errors.address} placeholder="123 Main St" style={{ gridColumn: '1 / -1' }} />
              <FormField label="City" name="city" value={form.city} onChange={handleChange} error={errors.city} placeholder="New York" />
              <FormField label="ZIP Code" name="zipCode" value={form.zipCode} onChange={handleChange} error={errors.zipCode} placeholder="10001" />
            </div>
          </div>

          {/* Payment info */}
          <div className="checkout-card" style={{ padding: '28px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              💳 Payment Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={form.cardNumber}
                  onChange={handleCardInput}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  style={fieldStyle(!!errors.cardNumber)}
                />
                {errors.cardNumber && <p style={errorStyle}>{errors.cardNumber}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Expiry (MM/YY)</label>
                <input
                  type="text"
                  name="expiry"
                  value={form.expiry}
                  onChange={handleExpiryInput}
                  placeholder="08/27"
                  maxLength={5}
                  style={fieldStyle(!!errors.expiry)}
                />
                {errors.expiry && <p style={errorStyle}>{errors.expiry}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={form.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength={4}
                  style={fieldStyle(!!errors.cvv)}
                />
                {errors.cvv && <p style={errorStyle}>{errors.cvv}</p>}
              </div>
            </div>
            <p style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔒 Your payment information is secure. This is a demo — no real charges are made.
            </p>
          </div>
        </div>

        {/* Right: order summary */}
        <div className="cart-summary">
          <h3 className="summary-title">Order Summary</h3>
          <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-primary)', flex: 1, marginRight: '8px' }}>
                  {item.title.length > 30 ? item.title.slice(0, 30) + '…' : item.title} × {item.quantity}
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
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
          <button
            type="submit"
            className="checkout-btn"
            disabled={isSubmitting || cart.length === 0}
            style={isSubmitting ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
          >
            {isSubmitting ? '⏳ Placing Order…' : `Place Order — $${total.toFixed(2)}`}
          </button>
          <Link to="/cart" className="clear-cart-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}>
            ← Back to Cart
          </Link>
        </div>
      </form>
    </div>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
}

function FormField({ label, name, value, onChange, error, placeholder, type = 'text', style }: FormFieldProps) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={fieldStyle(!!error)}
      />
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

function fieldStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--surface)',
    border: `1.5px solid ${hasError ? '#ef4444' : 'var(--border)'}`,
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };
}

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '0.78rem',
  marginTop: '4px',
};

export default CheckoutPage;
