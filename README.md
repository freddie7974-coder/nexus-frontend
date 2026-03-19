# NEXUS Tech Store — SQA E-Commerce Frontend

React + Vite frontend for the SQA university project. Connects to the Java backend on Railway.

## Setup

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm run build
# Push to GitHub → connect repo in Vercel dashboard
# Framework: Vite | Output dir: dist
```

The included `vercel.json` handles SPA client-side routing automatically.

## Pages & SQA Concepts

| Route    | Page               | SQA Demonstrated                              |
|----------|--------------------|-----------------------------------------------|
| `/login` | Login / Register   | BVA (password 8–20 chars), SQL injection note |
| `/store` | Product Store      | Live DB fetch, fault-tolerant fallback        |
| `/cart`  | Cart & Checkout    | ACID transaction with animated terminal log   |
| `/admin` | Admin Dashboard    | EP validation on stock (must be ≥ 0)          |
| `/orders`| Order History      | Real DB fetch, localStorage fallback          |

## Admin Access

Sign in with any email containing **admin** (e.g. `admin@nexus.io`).

## Backend

`https://web-production-f7a103.up.railway.app`

All POST bodies are `application/x-www-form-urlencoded`.

## Bugs Fixed vs Original Frontend

| # | Bug | Fix |
|---|-----|-----|
| 1 | `placeOrder` sent `product_id` — backend expected `productId` | Fixed in `api.js` |
| 2 | `updateStock` same mismatch | Fixed in `api.js` |
| 5 | Login stored email string as user id — order API needs integer | `Auth.jsx` now stores `data.user_id` |
| 6 | Order History had no real data source | Calls `GET /api/orders?user_id=<id>` with localStorage fallback |
| 7 | Store showed blank category/description when backend omits them | `Store.jsx` infers category from name; fills defaults |

## Known Limitations (SQA Presentation Points)

- Passwords stored in **plaintext** on the backend — BCrypt recommended
- Admin role is **client-side only** (email check) — backend middleware needed
- No **JWT/session tokens** — stateless auth
