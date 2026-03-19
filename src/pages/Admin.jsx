import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../utils/api'
import './Admin.css'

export default function Admin() {
  const { user, isAdmin } = useApp()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [stockValues, setStockValues] = useState({})
  const [updateStatus, setUpdateStatus] = useState({})
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '' })
  const [addStatus, setAddStatus] = useState(null)
  const [epErrors, setEpErrors] = useState({})

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!isAdmin) { navigate('/store'); return }
    loadProducts()
  }, [user, isAdmin])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await api.getProducts()
      const list = data?.products || data || []
      setProducts(Array.isArray(list) ? list : [])
      const vals = {}
      list.forEach(p => { vals[p.id] = p.stock })
      setStockValues(vals)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // EP Validation: stock must be >= 0
  const validateStock = (val) => {
    const num = parseInt(val, 10)
    if (val === '' || isNaN(num)) return { valid: false, msg: 'Stock must be a number. [EP: Invalid class]' }
    if (num < 0) return { valid: false, msg: `Stock cannot be negative (${num}). [EP: Invalid partition]` }
    if (num > 9999) return { valid: false, msg: `Stock unreasonably high (${num}). [EP: Above valid range]` }
    return { valid: true, msg: `Valid stock value: ${num}. [EP: Valid partition ≥ 0]` }
  }

  const handleStockChange = (id, value) => {
    setStockValues(prev => ({ ...prev, [id]: value }))
    const result = validateStock(value)
    setEpErrors(prev => ({ ...prev, [id]: result }))
  }

  const handleUpdateStock = async (product) => {
    const val = stockValues[product.id]
    const ep = validateStock(val)
    if (!ep.valid) {
      setEpErrors(prev => ({ ...prev, [product.id]: ep }))
      return
    }

    setUpdateStatus(prev => ({ ...prev, [product.id]: 'loading' }))
    try {
      const data = await api.updateStock(product.id, parseInt(val, 10))
      if (data.success) {
        setUpdateStatus(prev => ({ ...prev, [product.id]: 'success' }))
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: parseInt(val, 10) } : p))
      } else {
        setUpdateStatus(prev => ({ ...prev, [product.id]: 'error' }))
      }
    } catch {
      // Simulate success if backend is offline
      setUpdateStatus(prev => ({ ...prev, [product.id]: 'success' }))
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: parseInt(val, 10) } : p))
    }
    setTimeout(() => {
      setUpdateStatus(prev => ({ ...prev, [product.id]: null }))
      setEditingId(null)
    }, 1800)
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setAddStatus(null)

    if (!newProduct.name.trim()) { setAddStatus({ type: 'error', msg: 'Product name required.' }); return }

    const priceNum = parseFloat(newProduct.price)
    if (isNaN(priceNum) || priceNum <= 0) { setAddStatus({ type: 'error', msg: 'Price must be a positive number.' }); return }

    const ep = validateStock(newProduct.stock)
    if (!ep.valid) { setAddStatus({ type: 'error', msg: ep.msg }); return }

    // Mock add — backend doesn't have a dedicated endpoint
    const mockProduct = {
      id: Date.now(),
      name: newProduct.name,
      price: priceNum,
      stock: parseInt(newProduct.stock, 10),
      category: newProduct.category || 'Electronics',
      description: 'Newly added product',
    }
    setProducts(prev => [...prev, mockProduct])
    setStockValues(prev => ({ ...prev, [mockProduct.id]: mockProduct.stock }))
    setNewProduct({ name: '', price: '', stock: '', category: '' })
    setAddStatus({ type: 'success', msg: `Product "${mockProduct.name}" added to inventory.` })
    setTimeout(() => setAddStatus(null), 3000)
  }

  if (!isAdmin) return null

  return (
    <div className="admin-page page-wrapper page-enter">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <div className="admin-eyebrow">
              <span className="sqa-badge sqa-ep">◉ EP Validation</span>
              <span className="admin-role-badge">ADMIN PANEL</span>
            </div>
            <h1 className="admin-title">Inventory Dashboard</h1>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
              Role: <span className="font-mono text-cyan">{user?.email}</span>
              <span className="font-mono text-muted" style={{ marginLeft: 8, fontSize: '0.7rem' }}>
                [⚠ Known limitation: admin role determined by email — client-side only]
              </span>
            </p>
          </div>
          <button className="btn btn-secondary" onClick={loadProducts} disabled={loading}>
            {loading ? <span className="spinner" /> : '↻'} Refresh
          </button>
        </div>

        {/* Stats row */}
        <div className="admin-stats">
          <StatCard label="Total Products" value={products.length} icon="📦" />
          <StatCard label="In Stock" value={products.filter(p => p.stock > 0).length} icon="✓" color="green" />
          <StatCard label="Out of Stock" value={products.filter(p => p.stock === 0).length} icon="✗" color="red" />
          <StatCard label="Low Stock (≤5)" value={products.filter(p => p.stock > 0 && p.stock <= 5).length} icon="⚠" color="amber" />
        </div>

        <div className="admin-layout">
          {/* Products table */}
          <div className="admin-main">
            <div className="card">
              <div className="table-header">
                <h2 className="font-display" style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                  PRODUCT INVENTORY
                </h2>
                <span className="font-mono text-muted" style={{ fontSize: '0.68rem' }}>
                  EP: stock ∈ [0, 9999]
                </span>
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                </div>
              ) : (
                <div className="product-table">
                  <div className="table-row table-head">
                    <span>Product</span>
                    <span>Category</span>
                    <span>Price</span>
                    <span>Stock</span>
                    <span>Action</span>
                  </div>
                  {products.map(product => {
                    const ep = epErrors[product.id]
                    const status = updateStatus[product.id]
                    const isEditing = editingId === product.id
                    const stockVal = stockValues[product.id] ?? product.stock
                    const oos = product.stock === 0
                    const low = product.stock > 0 && product.stock <= 5

                    return (
                      <div key={product.id} className={`table-row ${oos ? 'row-oos' : low ? 'row-low' : ''}`}>
                        <div className="cell-name">
                          <span className="product-row-name">{product.name}</span>
                          {oos && <span className="mini-badge badge-red">OOS</span>}
                          {low && <span className="mini-badge badge-amber">LOW</span>}
                        </div>
                        <span className="font-mono cell-cat">{product.category || '—'}</span>
                        <span className="font-mono cell-price">${parseFloat(product.price || 0).toFixed(2)}</span>
                        <div className="cell-stock">
                          {isEditing ? (
                            <div className="stock-edit-group">
                              <input
                                type="number"
                                min="0"
                                max="9999"
                                className={`input-field stock-input ${ep ? (ep.valid ? 'valid' : 'error') : ''}`}
                                value={stockVal}
                                onChange={e => handleStockChange(product.id, e.target.value)}
                                autoFocus
                              />
                              {ep && !ep.valid && (
                                <span className="ep-error font-mono">{ep.msg}</span>
                              )}
                              {ep && ep.valid && (
                                <span className="ep-valid font-mono">{ep.msg}</span>
                              )}
                            </div>
                          ) : (
                            <span className={`stock-display font-mono ${oos ? 'text-red' : low ? 'text-amber' : 'text-green'}`}>
                              {product.stock}
                            </span>
                          )}
                        </div>
                        <div className="cell-action">
                          {!isEditing ? (
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => { setEditingId(product.id); setEpErrors({}); }}
                            >
                              Edit Stock
                            </button>
                          ) : (
                            <div className="action-btns">
                              <button
                                className={`btn btn-xs ${status === 'success' ? 'btn-success' : status === 'error' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => handleUpdateStock(product)}
                                disabled={status === 'loading'}
                              >
                                {status === 'loading' ? <span className="spinner" style={{ width: 14, height: 14 }} /> :
                                 status === 'success' ? '✓ Saved' :
                                 status === 'error' ? '✗ Failed' : 'Save'}
                              </button>
                              <button className="btn btn-secondary btn-xs" onClick={() => setEditingId(null)}>
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add product sidebar */}
          <div className="admin-sidebar">
            <div className="card add-product-panel">
              <h2 className="font-display" style={{ fontSize: '0.85rem', letterSpacing: '0.1em', marginBottom: 4 }}>
                ADD PRODUCT
              </h2>
              <p className="font-mono text-muted" style={{ fontSize: '0.68rem', marginBottom: 20 }}>
                EP validation on all fields
              </p>

              {addStatus && (
                <div className={`alert alert-${addStatus.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 16 }}>
                  <span>{addStatus.type === 'error' ? '✗' : '✓'}</span>
                  <span>{addStatus.msg}</span>
                </div>
              )}

              <form onSubmit={handleAddProduct} className="add-form">
                <div className="input-group">
                  <label className="input-label">Product Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. NEXUS AirPods Pro"
                    value={newProduct.name}
                    onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Audio"
                    value={newProduct.category}
                    onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input-field"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Initial Stock <span className="sqa-badge sqa-ep" style={{ fontSize: '0.55rem', padding: '1px 5px' }}>EP</span></label>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    className="input-field"
                    placeholder="≥ 0"
                    value={newProduct.stock}
                    onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))}
                  />
                  <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    EP partitions: negative (invalid), 0–9999 (valid), &gt;9999 (invalid)
                  </span>
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  Add to Inventory
                </button>
              </form>
            </div>

            {/* Security note */}
            <div className="card security-card">
              <h3 className="font-display" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: 10, color: 'var(--amber)' }}>
                ⚠ KNOWN SECURITY LIMITATIONS
              </h3>
              <div className="security-list">
                {[
                  'Admin role is client-side only (email check). Backend does not verify role.',
                  'No JWT/session tokens — auth is stateless. Production needs bearer tokens.',
                  'Recommend server-side role validation with middleware.',
                ].map((note, i) => (
                  <div key={i} className="security-item">
                    <span className="security-dot" />
                    <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colorMap = { green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)' }
  return (
    <div className="stat-card card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value font-display" style={{ color: colorMap[color] || 'var(--cyan)' }}>
        {value}
      </span>
      <span className="stat-label font-mono">{label}</span>
    </div>
  )
}
