import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, cartCount, isAdmin } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to={user ? '/store' : '/login'} className="nav-brand">
          <span className="brand-icon">⬡</span>
          <span className="brand-name">NEXUS</span>
          <span className="brand-sub">TECH</span>
        </Link>

        {user && (
          <div className="nav-links">
            <Link to="/store" className={`nav-link ${isActive('/store') ? 'active' : ''}`}>Store</Link>
            <Link to="/cart" className={`nav-link ${isActive('/cart') ? 'active' : ''}`}>
              Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>Orders</Link>
            {isAdmin && (
              <Link to="/admin" className={`nav-link nav-link-admin ${isActive('/admin') ? 'active' : ''}`}>
                Admin
              </Link>
            )}
          </div>
        )}

        <div className="nav-right">
          {user ? (
            <div className="nav-user">
              <span className="user-email">{user.email}</span>
              {isAdmin && <span className="admin-pill">ADMIN</span>}
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
