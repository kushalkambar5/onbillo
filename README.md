# Onbillo — Modern Billing & POS for Indian Retail

Onbillo is a full-stack billing / POS (point-of-sale) system built for Indian retail shops — kirana & grocery stores, supermarkets, restaurants & cafes, wholesale dealers, boutiques.

It combines:

- **Barcode billing** (camera scan via `react-zxing` + manual entry) with a shared **global product database**
- **GST-compliant invoices** (inclusive / exclusive / no-tax), 7 invoice templates, thermal-printer–friendly receipts
- **Shop management**: multi-shop, role-based access (`app_admin` / `shop_owner` / `shop_worker`), staff invites
- **Analytics**: sales summary, top products, sales trends, daily/weekly/monthly reports
- **Cloud sync with offline-first resilience** on the frontend, Postgres as source of truth on the backend
- **Auth via Clerk** (frontend `@clerk/nextjs`, backend `@clerk/backend` token verification + Clerk → backend Svix webhooks that auto-provision `users` rows)
- **Image uploads** (shop logos, product images) to Cloudflare R2 (S3-compatible) via the backend `/api/upload` endpoint

> Tagline from the landing page (`frontend/app/page.tsx`): _"The modern billing & POS built for Indian retail."_

---

## 1. Architecture

Monorepo with two apps (no shared package):

```
onbillo/
├── backend/    # NestJS 11 + Drizzle ORM + Postgres + Clerk + R2  (port 5000 by convention)
├── frontend/   # Next.js 16 (App Router) + React 19 + Clerk + Axios + Tailwind 4 (port 3000)
└── README.md   # this file
```

### Backend (`backend/`)

- **Framework**: NestJS 11 (`src/main.ts` → `AppModule`). CORS enabled, no global prefix — each controller declares its own `api/...` prefix.
- **DB**: PostgreSQL via `postgres` (postgres-js) + `drizzle-orm`. Schema in `src/db/schema.ts`, connection in `src/db/db.service.ts`, migrations in `drizzle/`, config in `drizzle.config.ts`.
- **Auth**: `src/auth/auth.guard.ts` — expects `Authorization: Bearer <Clerk JWT>`, verifies with `verifyToken(token, { secretKey: CLERK_SECRET_KEY })`, loads internal `users` row by `clerkId`, enforces `isBanned` / `isPremium` gates. Applied per-controller with `@UseGuards(AuthGuard)`.
- **User provisioning**: `POST /api/webhooks/clerk` (`src/webhooks/`) verifies Svix signature with `CLERK_WEBHOOK_SECRET` and creates/updates/deletes `users` rows on Clerk `user.created/updated/deleted` events.
- **Modules / API surface**:

| Module | Controller prefix | What it does |
|---|---|---|
| `admin` | `api/admin` | App-admin stats, user list, toggle premium (`PUT users/:id/premium`) |
| `analytics` | `api/shops/:shopId/analytics` | `summary`, `top-products`, `sales-trend` |
| `auth` | `auth` | Auth helpers |
| `bills` | `api/shops/:shopId/bills` | Create / list bills + bill items (paise/cents ints, unique `shopId+billNumber`) |
| `products` | `api/products` | Global product DB (barcode-unique, `pending/approved/rejected` moderation) |
| `products` | `api/shops/:shopId/products` | Per-shop catalog (`shop_products`: `unitPrice`, `isActive`) |
| `shops` | `api/shops` | Create shop, get user's shops, shop settings (GST, invoice template/prefix/counter) |
| `staff` | `api/shops/:shopId/staff` + `api/staff/invites` | Staff list, invite / accept / reject flow |
| `upload` | `api/upload` | `POST /` image upload (5 MB, png/jpg/gif/webp) → R2 URL; `DELETE /:key` |
| `users` | `api/users` | `GET /me`, `PUT /me` (profile + phone onboarding) |
| `webhooks` | `api/webhooks/clerk` | Clerk user-sync webhook |

- **Key tables** (`src/db/schema.ts`): `users`, `shops`, `products`, `shop_products`, `bills`, `bill_items`, `staff_requests` + enums (`user_role`, `currency=rupees`, `tax_type`, `invoice_templet 1-7`, `product_status`, `bill_status`, `request_status`). Money stored as integers (paise) to avoid float errors.
- **Validation**: Zod (`zod-validation.pipe`, DTO schemas per module) + global `AllExceptionsFilter` (`src/common/filters/`).
- **Helpers**: `create-db.js`, `clear-db.js`, `test-db.js`, `update-premium.js` (all read `DATABASE_URL` via `dotenv`).

### Frontend (`frontend/`)

- **Framework**: Next.js 16 App Router, React 19, Tailwind CSS 4, `Geist` / `Geist Mono` fonts. Wrapped in `ClerkProvider` (`app/layout.tsx`) + theme bootstrap + `PhonePromptModal` / `PremiumBlockModal`.
- **Routing**:
  - `/` — marketing landing (features, global-DB mockup, how-it-works, FAQ). `HomeRedirect` auto-routes signed-in users → `/admin/dashboard`, `/shop/[shopId]/dashboard|billing`, `/invites`, or `/onboarding`.
  - `/sign-in`, `/sign-up` — Clerk hosted auth (public; see `middleware.ts`).
  - `/onboarding` — new-user profile + phone + first shop creation.
  - `/shop/[shopId]/` — billing/POS, products, bills, staff, analytics, settings.
  - `/admin/`, `/invites`, `/profile/` — admin console, staff invites, user profile.
- **Data layer**: `app/utils/api/` — `client.ts` (Axios instance, `baseURL = NEXT_PUBLIC_API_URL || "http://localhost:5000"`), plus `shops.ts`, `products.ts`, `bills.ts`, `staff.ts`, `users.ts`, `admin.ts`, `types.ts`. Token from Clerk `getToken()` injected as `Authorization: Bearer`.
- **Middleware** (`middleware.ts`): `clerkMiddleware` — `/`, `/sign-in(.*)`, `/sign-up(.*)` public; everything else requires auth (plus `?boneyard=true` preview bypass).

### Request flow

```
Browser (Next.js) --Clerk JWT--> NestJS AuthGuard --verify--> Clerk
       |--REST /api/* (Axios, Bearer)--> NestJS --> Drizzle --> Postgres
       |--uploads--> NestJS /api/upload --> Cloudflare R2
Clerk --user.* webhook (Svix signed)--> NestJS /api/webhooks/clerk --> users table
```

---

## 2. Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ running locally (or a hosted URL from Neon / Supabase / RDS)
- A [Clerk](https://dashboard.clerk.com) application (dev keys are fine)
- (Optional, for uploads) A Cloudflare R2 bucket + R2 API token

---

## 3. Environment variables

### Backend — `backend/.env` (create from `backend/.env.example`)

| Variable | Required | Where used | How to get / example |
|---|---|---|---|
| `PORT` | No (defaults to `3000` in `src/main.ts`) | `src/main.ts` | Set `5000` to match frontend default. I filled `5000`. |
| `DATABASE_URL` | **Yes** | `src/db/db.service.ts`, `drizzle.config.ts`, `create-db.js`, `clear-db.js`, `test-db.js` | Local default I filled: `postgresql://postgres:postgres@localhost:5432/onbillo`. Hosted e.g. `postgresql://user:pass@host:5432/onbillo?sslmode=require` |
| `CLERK_SECRET_KEY` | **Yes** | `src/auth/auth.guard.ts` | Clerk Dashboard → API Keys → Secret Key (`sk_test_…`). **You fill manually.** |
| `CLERK_WEBHOOK_SECRET` | **Yes** | `src/webhooks/webhooks.controller.ts` | Clerk Dashboard → Webhooks → endpoint `…/api/webhooks/clerk` → Signing Secret (`whsec_…`). **You fill manually.** |
| `R2_BUCKET` | For uploads | `src/upload/upload.service.ts` | Cloudflare R2 bucket name. I set `onbillo-uploads`. |
| `R2_PUBLIC_URL` | For uploads | `src/upload/upload.service.ts` | Public dev URL e.g. `https://pub-xxxx.r2.dev`. Placeholder filled — **replace with yours.** |
| `R2_ENDPOINT` | For uploads | `src/upload/upload.service.ts` | `https://<account-id>.r2.cloudflarestorage.com`. Placeholder filled — **replace with yours.** |
| `R2_ACCESS_KEY_ID` | For uploads | `src/upload/upload.service.ts` | R2 API token access key. **You fill manually.** |
| `R2_SECRET_ACCESS_KEY` | For uploads | `src/upload/upload.service.ts` | R2 API token secret. **You fill manually.** |

Backend `.env` / `.env.example` have been created; only `PORT`, `DATABASE_URL`, and R2 name/URL placeholders are pre-filled. Secrets are empty for you to add.

### Frontend — `frontend/.env` (already existed; values now filled where derivable)

| Variable | Required | Where used | Value / action |
|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | `ClerkProvider` in `app/layout.tsx` | `pk_test_…` from Clerk → API Keys. **You fill manually.** |
| `CLERK_SECRET_KEY` | **Yes** | Server components / middleware | `sk_test_…` (same Clerk secret as backend). **You fill manually.** |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Clerk redirects | Filled: `/sign-in` (matches `app/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Clerk redirects | Filled: `/sign-up` (matches `app/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | Post-login landing | Filled: `/` (`HomeRedirect` then routes to shop/onboarding) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | Post-signup landing | Filled: `/onboarding` |
| `NEXT_PUBLIC_API_URL` | No (falls back to `http://localhost:5000` in `app/utils/api/client.ts`) | All API calls | Filled: `http://localhost:5000` — must match backend `PORT` |

---

## 4. Run locally

```bash
# 0. Clone + install
git clone <repo-url> onbillo
cd onbillo

# Backend
cd backend
npm install
cp .env.example .env        # then fill CLERK_*, R2_* secrets (PORT/DATABASE_URL already have local defaults)
node create-db.js           # creates the `onbillo` database (uses DATABASE_URL, swaps db to /postgres)
npm run start:dev           # watch mode → http://localhost:5000
# Drizzle: npx drizzle-kit push   (sync schema) | npx drizzle-kit studio (DB UI)

# Frontend (new terminal, from repo root)
cd frontend
npm install
cp .env.example .env        # then fill NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY
npm run dev                 # → http://localhost:3000
```

Useful backend helpers (from `backend/`, need `DATABASE_URL`):

```bash
node test-db.js       # sanity-check DB connection
node clear-db.js      # wipe all app tables (dev only!)
node update-premium.js # bulk premium-flag maintenance
npm run build && npm run start:prod  # production backend (node dist/main)
```

Clerk webhook for local dev: expose the backend (e.g. `ngrok http 5000`) and register `https://<ngrok-url>/api/webhooks/clerk` in the Clerk Dashboard → Webhooks so sign-ups create `users` rows.

---

## 5. Project structure (abridged)

```
backend/src/
├── main.ts app.module.ts app.controller.ts app.service.ts
├── auth/        # guard + module (CLERK_SECRET_KEY)
├── webhooks/    # Clerk Svix webhook (CLERK_WEBHOOK_SECRET)
├── db/          # schema.ts, db.service/module (DATABASE_URL)
├── shops/ products/ bills/ staff/ analytics/ admin/ users/ upload/
└── common/      # all-exceptions filter, zod pipe
backend/drizzle/ backend/drizzle.config.ts  # migrations + config

frontend/app/
├── page.tsx layout.tsx middleware.ts (root)  # landing, ClerkProvider, auth middleware
├── sign-in/ sign-up/ onboarding/ invites/ profile/
├── shop/[shopId]/   # dashboard, billing/POS, products, bills, staff, analytics, settings
├── admin/           # app-admin console
├── components/      # ThemeToggle, HomeRedirect, GlobalDatabaseMockup, modals, templates
└── utils/api/       # client.ts (NEXT_PUBLIC_API_URL) + shops/products/bills/staff/users/admin
```

---

## 6. Notes / conventions

- Money is stored as **integer paise** (`mrp`, `unitPrice`, `totalPrice`) — never floats.
- Invoice numbers are unique per shop (`unique_invoice` on `shopId+billNumber`); per-shop `invoicePrefix` + `invoiceCounter` in `shops`.
- Both `.env` files are git-ignored (`backend/.gitignore`, `frontend/.gitignore` list `.env*`); only `.env.example` files are safe to commit.
- Backend falls back gracefully for R2 (`my-bucket` / `pub-xxxx`) but uploads will fail without real R2 creds — everything else works without R2.
- Frontend works without `NEXT_PUBLIC_API_URL` set (falls back to `http://localhost:5000`), but Clerk keys are mandatory for any authenticated page.
