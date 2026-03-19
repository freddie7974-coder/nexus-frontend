import React, { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexus_user')) || null }
    catch { return null }
  })

  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexus_cart')) || [] }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('nexus_user', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    localStorage.setItem('nexus_cart', JSON.stringify(cart))
  }, [cart])

  // FIX Bug 5: login now stores data.user_id (integer) returned by the fixed backend.
  // user shape: { email: string, id: number }
  const login = (userData) => setUser(userData)

  const logout = () => {
    setUser(null)
    setCart([])
    localStorage.removeItem('nexus_user')
    localStorage.removeItem('nexus_cart')
  }

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, qty: Math.min(i.qty + qty, product.stock) }
            : i
        )
      }
      return [...prev, { ...product, qty }]
    })
  }

  const removeFromCart = (productId) =>
    setCart(prev => prev.filter(i => i.id !== productId))

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(i => i.id === productId ? { ...i, qty } : i))
  }

  const clearCart = () => setCart([])

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)
  const isAdmin   = user?.email?.toLowerCase().includes('admin')

  return (
    <AppContext.Provider value={{
      user, login, logout, isAdmin,
      cart, addToCart, removeFromCart, updateCartQty, clearCart, cartTotal, cartCount,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
