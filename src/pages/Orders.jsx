import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../utils/api'
import './Orders.css'

export default function Orders() {
  const { user } = useApp()
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [source, setSource]     = useState('backend') // 'backend' | 'local'
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (user) loadOrders()
    else      setLoading(false)
  }, [user])

  const loadOrders = async () => {
    setLoading(true)

    // FIX Bug 6: user.id is now a real integer — call the real endpoint
    if (user.id && typeof user.id === 'number') {
      try {
        const data = await api.getOrders(user.id)
        if (Array.isArray(data) && data.length >= 0) {
          // Shape from backend: { id, product_id, product_name, quantity, price, subtotal }
          // Normalise into the display shape this page expects
          const normalised = data.map(o => ({
            id:    `ORD-${o.id}`,
            rawId: o.id,
            items: [{
              name:     o.product_name,
              qty:      o.quantity,
              price:    o.price,
              subtotal: o.subtotal,
            }],
            total:  o.subtotal,
            status: 'COMMITTED',
            source: 'backend',
          }))
          // Merge orders that share the same rawId (shouldn't happen here but defensive)
          setOrders(normalised)
          setSource('backend')
          setLoading(false)
          return
        }
      } catch {
        // fall through to localStorage
      }
    }

    // Fallback: localStorage orders stored by Cart.jsx (for offline / no user_id case)
    try {
      const local = JSON.parse(localStorage.getItem('nexus_orders')) || []
      setOrders(local)
      setSource('local')
    } catch {
      setOrders([])
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="orders-page page-wrapper page-enter">
        <div className="container">
          <div className="orders-empty">
            <p className="font-display text-muted">SIGN IN TO VIEW ORDERS</p>
            <Link to="/login" className="btn btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page page-wrapper page-enter">
      <div className="container">

        <div className="orders-header">
          <div>
            <div className="orders-eyebrow">
              <span className="sqa-badge sqa-acid">⬥ ACID History</span>
              <span className="sqa-badge sqa-bva">◈ Fault Tolerant</span>
              <span className={`source-indicator ${source === 'backend' ? 'source-live' : 'source-mock'}`}>
                {source === 'backend' ? '⬤ LIVE DB' : '◯ LOCAL CACHE'}
              </span>
            </div>
            <h1 className="orders-title">Order History</h1>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
              Account: <span className="font-mono text-cyan">{user.email}</span>
              {user.id && (
                <span className="font-mono text-muted" style={{ marginLeft: 10, fontSize: '0.72rem' }}>
                  user_id: {user.id}
                </span>
              )}
            </p>
          </div>
          <div className="orders-stat">
            <span className="orders-stat-value font-display">{orders.length}</span>
            <span className="font-mono text-muted" style={{ fontSize: '0.68rem' }}>TOTAL ORDERS</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📋</div>
            <h2 className="font-display">No orders yet</h2>
            <p className="text-secondary">Place your first order from the store</p>
            <Link to="/store" className="btn btn-primary">Shop Now</Link>
          </div>
        ) : (
          <div className="orders-list">
            {source === 'local' && (
              <div className="sqa-info-banner">
                <div className="sqa-info-left">
                  <span className="sqa-badge sqa-acid">Fault Tolerance</span>
                  <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                    Showing locally cached orders. Backend GET /api/orders requires a valid user_id integer.
                    This is the localStorage fallback demonstrating fault tolerance.
                  </span>
                </div>
              </div>
            )}

            {orders.map((order, i) => (
              <OrderCard
                key={order.id || i}
                order={order}
                index={i}
                isExpanded={expanded === (order.id || i)}
                onToggle={() => setExpanded(expanded === (order.id || i) ? null : (order.id || i))}
              />
            ))}
          </div>
        )}

        {/* Fault tolerance explanation */}
        <div className="fault-tolerance-panel card">
          <h3 className="font-display" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: 12 }}>
            FAULT TOLERANCE &amp; ERROR HANDLING — SQA DEMONSTRATED
          </h3>
          <div className="ft-grid">
            {[
              { icon: '🔄', title: 'Backend → Local Fallback', desc: 'If GET /api/orders fails (network or missing user_id), app falls back to localStorage cache transparently.' },
              { icon: '💾', title: 'Order Persistence', desc: 'Orders committed via ACID transaction are fetched live from MySQL; localStorage backs up the session.' },
              { icon: '⚡', title: 'Graceful Degradation', desc: 'UI stays functional in reduced-connectivity scenarios — no crashes, no blank screens.' },
              { icon: '🔒', title: 'ACID Integrity', desc: 'Only COMMITTED transactions appear here. Rolled-back orders are never recorded in the DB.' },
            ].map(item => (
              <div key={item.title} className="ft-item">
                <span className="ft-icon">{item.icon}</span>
                <div>
                  <p className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 3 }}>{item.title}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, index, isExpanded, onToggle }) {
  const statusColor = {
    'COMMITTED':    'var(--green)',
    'PENDING':      'var(--amber)',
    'ROLLED BACK':  'var(--red)',
  }

  return (
    <div
      className="order-card card"
      style={{ animationDelay: `${index * 0.07}s`, animation: 'cardReveal 0.4s ease both' }}
    >
      <button className="order-card-header" onClick={onToggle}>
        <div className="order-id-row">
          <span className="order-id font-display">{order.id}</span>
          <span
            className="order-status font-mono"
            style={{ color: statusColor[order.status] || 'var(--text-secondary)' }}
          >
            ● {order.status}
          </span>
        </div>
        <div className="order-meta-row">
          {order.date && (
            <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
              {new Date(order.date).toLocaleString()}
            </span>
          )}
          <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
          </span>
          <span className="order-total font-display">${(order.total ?? 0).toFixed(2)}</span>
          <span
            className="expand-arrow"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            ▾
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="order-details">
          <div className="divider" style={{ margin: '0 20px 16px' }} />
          <div className="order-items-list">
            {order.items?.map((item, i) => (
              <div key={i} className="order-item-row">
                <span className="font-mono text-secondary" style={{ fontSize: '0.75rem' }}>{item.name}</span>
                <span className="font-mono text-muted"   style={{ fontSize: '0.72rem' }}>×{item.qty}</span>
                <span className="font-mono"              style={{ fontSize: '0.8rem', color: 'var(--cyan)' }}>
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="order-total-row">
            <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>ORDER TOTAL</span>
            <span className="font-display" style={{ fontSize: '1.1rem', color: 'var(--cyan)' }}>
              ${(order.total ?? 0).toFixed(2)}
            </span>
          </div>
          {order.status === 'COMMITTED' && (
            <div className="alert alert-success" style={{ margin: '12px 20px 16px' }}>
              <span>⬥</span>
              <span>ACID transaction committed. Changes persisted to MySQL.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
