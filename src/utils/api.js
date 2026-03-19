const BASE = 'https://web-production-5b784.up.railway.app'

async function post(endpoint, data) {
  const body = new URLSearchParams(data).toString()
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  return res.json()
}

async function get(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`)
  return res.json()
}

export const api = {
  health: () =>
    get('/health'),

  register: (email, password) =>
    post('/api/register', { email, password }),

  login: (email, password) =>
    post('/api/login', { email, password }),

  // FIX Bug 1: parameter name is "productId" (not "product_id") — matches backend
  placeOrder: (userId, productId, quantity) =>
    post('/api/order', { user_id: userId, productId, quantity }),

  getProducts: () =>
    get('/api/admin/products'),

  // FIX Bug 2: parameter name is "productId" (not "product_id") — matches backend
  updateStock: (productId, stock) =>
    post('/api/admin/update-stock', { productId, stock }),

  // FIX Bug 6: now calls the real /api/orders endpoint
  getOrders: (userId) =>
    get(`/api/orders?user_id=${userId}`),
}

// BVA: password must be 8–20 chars (lower boundary: 8, upper boundary: 20)
export function validatePassword(pw) {
  if (!pw)          return { valid: false, msg: 'Password is required.' }
  if (pw.length < 8)  return { valid: false, msg: `Too short — ${pw.length}/8 min chars. [BVA: below lower boundary]` }
  if (pw.length > 20) return { valid: false, msg: `Too long — ${pw.length}/20 max chars. [BVA: above upper boundary]` }
  return { valid: true, msg: `Valid length (${pw.length} chars). [BVA: within accepted range]` }
}

export function validateEmail(email) {
  if (!email) return { valid: false, msg: 'Email is required.' }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) return { valid: false, msg: 'Invalid email format.' }
  return { valid: true, msg: '' }
}
