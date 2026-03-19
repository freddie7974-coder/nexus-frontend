import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../utils/api'
import './Store.css'

// Infer category from product name when backend doesn't supply one (Bug 7 fallback)
function guessCategoryFromName(name = '') {
  const n = name.toLowerCase()
  if (n.includes('laptop') || n.includes('notebook') || n.includes('macbook')) return 'Laptops'
  if (n.includes('headphone') || n.includes('earbud') || n.includes('audio') || n.includes('speaker')) return 'Audio'
  if (n.includes('keyboard') || n.includes('mouse') || n.includes('pad')) return 'Peripherals'
  if (n.includes('monitor') || n.includes('display') || n.includes('screen')) return 'Displays'
  if (n.includes('ssd') || n.includes('drive') || n.includes('storage') || n.includes('nvme')) return 'Storage'
  if (n.includes('vr') || n.includes('headset') || n.includes('ar')) return 'VR/AR'
  if (n.includes('charger') || n.includes('cable') || n.includes('hub') || n.includes('adapter')) return 'Accessories'
  return 'Electronics'
}

// Fallback products if backend is down
const FALLBACK_PRODUCTS = [
  { id: 1, name: 'NEXUS Pro X1 Laptop', price: 1299.99, stock: 15, category: 'Laptops', description: 'Ultra-thin powerhouse with OLED display' },
  { id: 2, name: 'HyperAudio ANC Buds', price: 199.99, stock: 42, category: 'Audio', description: 'Adaptive noise cancellation, 30hr battery' },
  { id: 3, name: 'CyberKey Pro Keyboard', price: 159.99, stock: 0, category: 'Peripherals', description: 'Mechanical switches, per-key RGB, TKL layout' },
  { id: 4, name: 'Quantum 4K Monitor', price: 449.99, stock: 8, category: 'Displays', description: '27" 4K 144Hz HDR1000 gaming display' },
  { id: 5, name: 'FluxPad Pro Mouse', price: 89.99, stock: 25, category: 'Peripherals', description: '26000 DPI optical sensor, 70hr wireless' },
  { id: 6, name: 'NanoCore SSD 2TB', price: 129.99, stock: 30, category: 'Storage', description: '7400MB/s read, NVMe PCIe 4.0' },
  { id: 7, name: 'VoidWave VR Headset', price: 599.99, stock: 5, category: 'VR/AR', description: 'Standalone 4K per eye, 120Hz refresh' },
  { id: 8, name: 'AtomCharge 240W GaN', price: 79.99, stock: 60, category: 'Accessories', description: '4-port GaN charger, charges 4 devices simultaneously' },
]

const CATEGORIES = ['All', 'Laptops', 'Audio', 'Peripherals', 'Displays', 'Storage', 'VR/AR', 'Accessories']

const PRODUCT_ICONS = {
  Laptops: '💻', Audio: '🎧', Peripherals: '⌨', Displays: '🖥',
  Storage: '💾', 'VR/AR': '🥽', Accessories: '🔌',
}

// Infer a category from a product name when the backend doesn't supply one
function guessCategoryFromName(name = '') {
  const n = name.toLowerCase()
  if (n.includes('laptop') || n.includes('notebook') || n.includes('macbook')) return 'Laptops'
  if (n.includes('headphone') || n.includes('earbud') || n.includes('bud') || n.includes('audio') || n.includes('speaker')) return 'Audio'
  if (n.includes('keyboard') || n.includes('mouse') || n.includes('pad') || n.includes('peripheral')) return 'Peripherals'
  if (n.includes('monitor') || n.includes('display') || n.includes('screen')) return 'Displays'
  if (n.includes('ssd') || n.includes('hdd') || n.includes('drive') || n.includes('storage')) return 'Storage'
  if (n.includes('vr') || n.includes('headset') || n.includes('ar') || n.includes('quest')) return 'VR/AR'
  if (n.includes('charger') || n.includes('cable') || n.includes('hub') || n.includes('adapter')) return 'Accessories'
  return 'Electronics'
}

export default function Store() {
  const { addToCart, user, cart } = useApp()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [addedIds, setAddedIds] = useState(new Set())
  const [source, setSource] = useState('backend')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await api.getProducts()
      if (data && (data.products || Array.isArray(data))) {
        const raw  = data.products || data
        // FIX Bug 7: backend may not return category/description — fill with sensible defaults
        const list = raw.map(p => ({
          ...p,
          category:    p.category    || guessCategoryFromName(p.name) || 'Electronics',
          description: p.description || '',
        }))
        setProducts(list.length ? list : FALLBACK_PRODUCTS)
        setSource('backend')
      } else {
        setProducts(FALLBACK_PRODUCTS)
        setSource('mock')
      }
    } catch {
      setProducts(FALLBACK_PRODUCTS)
      setSource('mock')
      setError('Backend unavailable — showing mock data. Fault tolerance active.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    if (product.stock === 0) return
    addToCart(product)
    setAddedIds(prev => new Set([...prev, product.id]))
    setTimeout(() => setAddedIds(prev => {
      const next = new Set(prev)
      next.delete(product.id)
      return next
    }), 1500)
  }

  const filtered = products.filter(p => {
    const matchCat = category === 'All' || p.category === category
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const inCart = (id) => cart.find(i => i.id === id)

  return (
    <div className="store-page page-wrapper page-enter">
      {/* Header */}
      <div className="store-header">
        <div className="container">
          <div className="store-header-inner">
            <div>
              <div className="store-eyebrow">
                <span className="sqa-badge sqa-bva">◈ Live DB Query</span>
                <span className={`source-indicator ${source === 'backend' ? 'source-live' : 'source-mock'}`}>
                  {source === 'backend' ? '⬤ LIVE DATA' : '◯ MOCK DATA'}
                </span>
              </div>
              <h1 className="store-title">Product Store</h1>
              <p className="store-subtitle text-secondary">
                {products.length} products loaded from backend
              </p>
            </div>
            <button className="btn btn-secondary" onClick={loadProducts} disabled={loading}>
              {loading ? <span className="spinner" /> : '↻'} Refresh
            </button>
          </div>

          {error && (
            <div className="alert alert-warning" style={{ marginTop: 12 }}>
              <span>⚠</span><span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        {/* Filters */}
        <div className="store-controls">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="category-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {PRODUCT_ICONS[cat] || ''} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="store-loading">
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p className="text-secondary">Fetching products from database...</p>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => handleAddToCart(product)}
                added={addedIds.has(product.id)}
                inCart={!!inCart(product.id)}
                index={i}
              />
            ))}
            {filtered.length === 0 && (
              <div className="no-results">
                <p className="font-display text-muted">NO PRODUCTS FOUND</p>
                <button className="btn btn-secondary" onClick={() => { setCategory('All'); setSearch('') }}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, onAdd, added, inCart, index }) {
  const icon = PRODUCT_ICONS[product.category] || '📦'
  const outOfStock = product.stock === 0
  const lowStock = product.stock > 0 && product.stock <= 5

  return (
    <div
      className="product-card card"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Product image placeholder */}
      <div className={`product-visual ${outOfStock ? 'visual-oos' : ''}`}>
        <span className="product-icon">{icon}</span>
        <div className="product-visual-bg" />
        {outOfStock && <div className="oos-overlay">OUT OF STOCK</div>}
        {lowStock && <div className="lowstock-badge">LOW STOCK</div>}
      </div>

      <div className="product-info">
        <div className="product-meta">
          <span className="tag">{product.category || 'Electronics'}</span>
          {product.stock > 0 && (
            <span className="font-mono stock-count" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {product.stock} left
            </span>
          )}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description text-secondary">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
          <button
            className={`btn ${added ? 'btn-success' : outOfStock ? 'btn-danger' : 'btn-primary'} btn-add`}
            onClick={onAdd}
            disabled={outOfStock}
          >
            {added ? '✓ Added' : outOfStock ? 'Unavailable' : inCart ? '+ More' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
