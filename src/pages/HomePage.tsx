import { useState, useEffect, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import type { Product } from '../types';
import { fetchProducts, type ProductsQuery } from '../lib/api';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';

const CATEGORIES = ['all', 'electronics', 'clothing', 'home'];
const BRANDS = ['all', 'Sony', 'Apple', 'JBL', 'Bose', 'Uniqlo', "Levi's", 'Nike', 'Zara', 'Philips', 'Anthropologie', 'Yankee Candle', 'Herman Miller'];
const ITEMS_PER_PAGE = 8;

// Fuse.js config — fuzzy search across product fields with weighted scoring
const FUSE_OPTIONS = {
  keys: [
    { name: 'title',       weight: 0.5 },
    { name: 'brand',       weight: 0.3 },
    { name: 'category',    weight: 0.1 },
    { name: 'description', weight: 0.1 },
  ],
  threshold: 0.45,       // 0 = exact, 1 = match anything — 0.45 is comfortably fuzzy
  includeScore: true,
  minMatchCharLength: 1,
};

function HomePage() {
  const { addToCart, wishlist, toggleWishlist } = useStore();

  // ─── Filter state ─────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeBrand, setActiveBrand]       = useState<string>('all');
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [sortBy, setSortBy]                 = useState<string>('default');
  const [minPrice, setMinPrice]             = useState<string>('');
  const [maxPrice, setMaxPrice]             = useState<string>('');
  const [minRating, setMinRating]           = useState<number>(0);
  const [currentPage, setCurrentPage]       = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ─── Data state ──────────────────────────────────────────────────────────
  const [products, setProducts]             = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages]         = useState<number>(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_total, setTotal]                  = useState<number>(0);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  // Debounce search (400ms)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 400);
  };

  // Reset page on any filter change
  const setCategory = (cat: string) => { setActiveCategory(cat); setCurrentPage(1); };
  const setBrand    = (b: string)   => { setActiveBrand(b);      setCurrentPage(1); };
  const setSort     = (s: string)   => { setSortBy(s);           setCurrentPage(1); };
  const setMinP     = (v: string)   => { setMinPrice(v);         setCurrentPage(1); };
  const setMaxP     = (v: string)   => { setMaxPrice(v);         setCurrentPage(1); };
  const setRating   = (v: number)   => { setMinRating(v);        setCurrentPage(1); };

  // ─── Fetch from backend ────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sortMap: Record<string, ProductsQuery['sortBy']> = {
        'price-low':  'price_asc',
        'price-high': 'price_desc',
        'rating':     'rating_desc',
        'default':    'default',
      };

      const hasSearch = !!debouncedSearch;

      const data = await fetchProducts({
        search:    undefined, // We perform fuzzy search client-side for typo tolerance
        category:  activeCategory === 'wishlist' ? undefined : activeCategory,
        brand:     activeBrand !== 'all' ? activeBrand : undefined,
        sortBy:    sortMap[sortBy] ?? 'default',
        page:      hasSearch ? 1 : currentPage,
        limit:     hasSearch ? 100 : ITEMS_PER_PAGE,
        minPrice:  minPrice ? Number(minPrice) : undefined,
        maxPrice:  maxPrice ? Number(maxPrice) : undefined,
        minRating: minRating > 0 ? minRating : undefined,
      });

      let result = data.products.map((p) => ({ ...p, price: Number(p.price) }));

      // Wishlist filter is client-side (wishlist IDs already in state)
      if (activeCategory === 'wishlist') {
        result = result.filter((p) => wishlist.includes(p.id));
      }

      setProducts(result);

      if (!hasSearch) {
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? result.length);
      }
    } catch (err) {
      setError('Failed to load products. Is the backend running?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activeBrand, debouncedSearch, sortBy, currentPage, minPrice, maxPrice, minRating, wishlist]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ─── Fuse.js fuzzy search & pagination ─────────────────────────────────────
  useEffect(() => {
    if (!debouncedSearch) {
      setDisplayProducts(products);
      return;
    }
    const fuse = new Fuse(products, FUSE_OPTIONS);
    const results = fuse.search(debouncedSearch);
    if (results.length > 0) {
      const sortedProducts = results.map((r) => r.item);
      const totalResults = sortedProducts.length;
      setTotal(totalResults);
      setTotalPages(Math.ceil(totalResults / ITEMS_PER_PAGE));
      
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginatedResults = sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      setDisplayProducts(paginatedResults);
    } else {
      setDisplayProducts([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [products, debouncedSearch, currentPage]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-decoration">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Discover Premium Products</h1>
          <p className="hero-subtitle">
            Curated collection of premium products for modern living. Shop electronics, clothing, and home essentials.
          </p>
          <a href="#products" className="hero-btn">Shop Now</a>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section" id="products">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Featured Products</h2>
          {!isLoading && !error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''} found
              </span>
            </div>
          )}
        </div>

        {/* ── Category tabs + Search + Sort ── */}
        <div className="filters-bar">
          <div className="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
            <button
              className={`category-tab wishlist-tab ${activeCategory === 'wishlist' ? 'active' : ''}`}
              onClick={() => setCategory('wishlist')}
            >
              ❤️ Wishlist ({wishlist.length})
            </button>
          </div>

          <div className="filters-right">
            <div className="sort-wrapper">
              <select className="sort-select" value={sortBy} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Sort: Default</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="rating">Rating: Best first</option>
              </select>
            </div>
            <div className="search-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                id="product-search-input"
                className="search-input"
                placeholder="Search products, brands… (fuzzy)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Advanced Filters Row ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
          padding: '14px 20px', background: 'var(--surface)', borderRadius: '12px',
          border: '1px solid var(--border)', marginBottom: '24px',
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            🔎 Filters:
          </span>

          {/* Brand filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Brand:</span>
            <select
              id="brand-filter-select"
              value={activeBrand}
              onChange={(e) => setBrand(e.target.value)}
              style={{ ...filterInputStyle, width: 'auto', minWidth: '110px' }}
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b === 'all' ? 'All Brands' : b}</option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>$</span>
            <input
              type="number" placeholder="Min" value={minPrice}
              onChange={(e) => setMinP(e.target.value)} min={0}
              style={{ ...filterInputStyle, width: '68px' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>–</span>
            <input
              type="number" placeholder="Max" value={maxPrice}
              onChange={(e) => setMaxP(e.target.value)} min={0}
              style={{ ...filterInputStyle, width: '68px' }}
            />
          </div>

          {/* Min rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating ≥</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(minRating === star ? 0 : star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px',
                    fontSize: '16px', lineHeight: 1,
                    color: star <= minRating ? '#f59e0b' : 'var(--text-muted)',
                  }}
                  title={`Min rating: ${star}`}
                >★</button>
              ))}
              {minRating > 0 && (
                <button
                  onClick={() => setRating(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}
                >✕</button>
              )}
            </div>
          </div>

          {/* Clear all */}
          {(minPrice || maxPrice || minRating > 0 || debouncedSearch || activeBrand !== 'all') && (
            <button
              id="clear-all-filters-btn"
              onClick={() => {
                setMinP(''); setMaxP(''); setRating(0);
                setSearchQuery(''); setDebouncedSearch('');
                setCurrentPage(1); setActiveBrand('all');
              }}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                padding: '4px 10px', fontSize: '0.78rem', color: 'var(--text-muted)',
                cursor: 'pointer', marginLeft: 'auto',
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="empty-state">
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            <h3>Loading products…</h3>
            <p>Fetching from the database</p>
          </div>
        )}

        {/* ── Error ── */}
        {!isLoading && error && (
          <div className="empty-state">
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
            <h3>Could not load products</h3>
            <p>{error}</p>
            <button className="hero-btn" style={{ marginTop: '16px' }} onClick={loadProducts}>Retry</button>
          </div>
        )}

        {/* ── Product grid ── */}
        {!isLoading && !error && (
          <div className="products-grid">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} onViewDetails={setSelectedProduct} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !error && displayProducts.length === 0 && (
          <div className="empty-state">
            {activeCategory === 'wishlist' ? (
              <><h3>Your wishlist is empty</h3><p>Click the ❤️ icon on any product to add it!</p></>
            ) : (
              <><h3>No products found</h3><p>Try adjusting your search or filters.</p></>
            )}
          </div>
        )}

        {/* ── Pagination ── */}
        {!isLoading && !error && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '36px' }}>
            <button
              className="qty-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 16px', borderRadius: '8px' }}
            >← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: '1.5px solid',
                  borderColor: page === currentPage ? 'var(--accent)' : 'var(--border)',
                  background: page === currentPage ? 'var(--accent)' : 'var(--surface)',
                  color: page === currentPage ? '#fff' : 'var(--text-primary)',
                  fontWeight: page === currentPage ? '700' : '400',
                  cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.15s',
                }}
              >{page}</button>
            ))}
            <button
              className="qty-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 16px', borderRadius: '8px' }}
            >Next →</button>
          </div>
        )}
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isInWishlist={wishlist.includes(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
        />
      )}
    </>
  );
}

const filterInputStyle: React.CSSProperties = {
  padding: '5px 8px',
  background: 'var(--bg)', border: '1.5px solid var(--border)',
  borderRadius: '6px', color: 'var(--text-primary)',
  fontSize: '0.82rem', outline: 'none',
};

export default HomePage;
