# Onbillo — Modern Billing & POS for Indian Retail

Onbillo is a full-stack billing / POS (point-of-sale) system built for Indian retail shops — kirana & grocery stores, supermarkets, restaurants & cafes, wholesale dealers, boutiques.

It combines:

- **Barcode billing** (camera scan via `react-zxing` + manual entry) with a shared **global product database**
- **GST-compliant invoices** (inclusive / exclusive / no-tax), 7 invoice templates, thermal-printer–friendly receipts
- **Shop management**: multi-shop, role-based access (`app_admin` / `shop_owner` / `shop_worker`), staff invites
- **Analytics**: sales summary, top products, sales trends, daily/weekly/monthly reports
- **Cloud sync with offline-first resilience** on the frontend, Postgres as source of truth on the backend
- **AI Shop Assistant** — per-shop chat (`/shop/[shopId]/ai_assistant`) powered by Groq + OpenAI Agents SDK, with 6 shop-scoped read-only tools for inventory, bills, analytics, staff, and custom SQL reports (see §6)
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
| `ai-assistant` | `api/shops/:shopId/ai-assistant` | AI chat (Groq + OpenAI Agents SDK, 6 shop-scoped tools — see §6) |
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
| `GROQ_API_KEY` | For AI Assistant (§6) | `src/ai-assistant/ai-assistant.service.ts` (mapped to `OPENAI_API_KEY` fallback) | Groq Console → API Keys (`gsk_…`). **You fill manually.** |
| `OPENAI_API_KEY` | For AI Assistant (§6) | `src/ai-assistant/ai-assistant.service.ts` (OpenAI Agents SDK auth) | Same as `GROQ_API_KEY` if using Groq; or a real OpenAI key if you point `OPENAI_BASE_URL` at OpenAI. **You fill manually.** |
| `OPENAI_BASE_URL` | No (defaults to `https://api.groq.com/openai/v1`) | `src/ai-assistant/ai-assistant.service.ts` | Keep Groq default, or set `https://api.openai.com/v1` for OpenAI. |
| `GROQ_MODEL` | No (defaults to `openai/gpt-oss-20b`) | `src/ai-assistant/ai-assistant.service.ts` | e.g. `openai/gpt-oss-20b`, `groq/compound-mini`. |

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
├── shop/[shopId]/   # dashboard, billing/POS, products, bills, staff, analytics, settings, ai_assistant (AI chat UI)
├── admin/           # app-admin console
├── components/      # ThemeToggle, HomeRedirect, GlobalDatabaseMockup, modals, templates
└── utils/api/       # client.ts (NEXT_PUBLIC_API_URL) + shops/products/bills/staff/users/admin/aiAssistant
```

---

## 6. AI Shop Assistant — what it does, how it works, how it's built

Per-shop conversational assistant at `frontend/app/shop/[shopId]/ai_assistant/page.tsx` (sidebar item **AI Assistant**, `Bot` icon). It answers live questions about **that shop only** — inventory, sales, staff, settings — by calling tools against Postgres instead of hallucinating.

### 6.1 What it can do

- **Shop details** — name, address, city, GST/tax rate, invoice prefix/counter, currency.
- **Inventory Q&A** — list products with unit price (paise → `₹` formatted), stock qty, low-stock flag (`quantity <= 5`); filter by name/brand/barcode; `lowStockOnly` mode.
- **Bills** — recent bills (bill number, total `₹`, status, notes, timestamp); default 10, max 25 per call.
- **Analytics summary** — active-bill count, total revenue `₹`, active-product count, low-stock count.
- **Staff** — members (name/email/phone/role) + pending `staff_requests` join invites.
- **Custom SQL reports** — for anything the fixed tools can't cover: date-range sales, top-N products, joins/aggregations (e.g. *"top 5 products by revenue this month"*, *"sales trend by day last 7 days"*). Read-only `SELECT`/`WITH` only, auto-scoped to the current shop.
- **Chat UX** — greeting message listing capabilities, 4 suggested prompts (`Show me low stock items`, `Summarize today's sales`, `How many products do I have?`, `Show shop analytics`), streaming-style loading indicator, `Enter` to send / `Shift+Enter` for newline, clear-chat button, lightweight `**bold**` + bullet rendering.

Example prompts that work out of the box:

```
Show me low stock items
Summarize today's sales
How many products do I have?
Show shop analytics
Who are my staff members?
What were my top 5 bills this week? (via run_custom_sql)
```

### 6.2 How it works (request flow)

```
[Chat UI] page.tsx --prompt + history--> aiAssistantApi.sendMessage()
  --POST /api/shops/:id/ai-assistant { prompt (1-2000 chars), history[] } + Clerk JWT-->
[NestJS] AuthGuard (Clerk verify) + ShopRolesGuard (owner | shop_worker) + Zod (AiAssistantPromptSchema)
  --> AiAssistantService.processPrompt(shopId, prompt)
    --> new Agent({ name: "Onbillo Shop Assistant", model: GROQ_MODEL, maxTokens: 800,
                    instructions: shop-aware system prompt (INR ₹, bullets/tables, low-stock <=5) })
    --> run(agent, prompt)  // OpenAI Agents SDK tool loop
      --> 1 of 6 shop-bound tools --> Drizzle --> Postgres (read-only) --> JSON --> LLM
  <-- { response: markdown string, agentName } -- Chat bubble
```

Key files:

- UI: `frontend/app/shop/[shopId]/ai_assistant/page.tsx` (+ icon `frontend/public/onbillo_ai_icon.png`)
- API client: `frontend/app/utils/api/aiAssistant.ts` → `POST /api/shops/:shopId/ai-assistant`
- Backend: `backend/src/ai-assistant/ai-assistant.controller.ts` (route + guards + Zod), `backend/src/ai-assistant/ai-assistant.service.ts` (agent + 6 tools + SQL sandbox), `backend/src/ai-assistant/ai-assistant.module.ts` (wires `DbModule`), schema `backend/src/common/validation/schemas.ts:251` (`AiAssistantPromptSchema`).

### 6.3 How it's built

- **LLM runtime**: Groq's OpenAI-compatible endpoint (`OPENAI_BASE_URL=https://api.groq.com/openai/v1` by default) driven through `@openai/agents@^0.18.0` (`Agent`, `run`, `tool`) + `openai@^7.15.0` + `zod` for tool params. Default model `GROQ_MODEL || "openai/gpt-oss-20b"` (also tested with `groq/compound-mini`). Constructor maps `GROQ_API_KEY → OPENAI_API_KEY` if only the former is set.
- **Tool definitions** (`createShopTools(shopId)` in `ai-assistant.service.ts`): each tool closes over `shopId` so every Drizzle query is pre-filtered (`eq(shopProducts.shopId, shopId)` etc.) and result sets are capped (inventory 30, bills 25) to protect context.

| Tool | Params | What it queries |
|---|---|---|
| `get_shop_details` | — | `shops` by id |
| `get_shop_inventory` | `searchQuery?`, `lowStockOnly?` | `shop_products ⨝ products`, formats `unitPrice/100 → ₹`, `isLowStock = qty<=5` |
| `get_recent_bills` | `limit?` (default 10, cap 25) | `bills` by `shopId`, `createdAt desc` |
| `get_shop_analytics_summary` | — | active `bills` sum → revenue `₹`, active `shop_products` count, low-stock count |
| `get_staff_members` | — | `users` by `shopId` + `staff_requests ⨝ users` |
| `run_custom_sql` | `query` (1–2000 chars, single `SELECT`/`WITH`, no `;`/comments/schema-quals) | Sandboxed SQL (see §6.4) |

- **System prompt**: injects live shop name/city, instructs: always use tools for real data, show money in `₹` (tools already convert; raw SQL columns are paise → divide by 100), be concise/polite, use bullets/markdown tables, treat `<=5` as low stock, prefer `run_custom_sql` for multi-table/date-range/ranking questions.
- **Frontend**: plain React state (`messages: AiChatMessage[]`), Clerk `getToken()` → `Authorization: Bearer`, sends `history` (all but the initial greeting) so follow-ups keep context server-side (note: service currently runs `run(agent, prompt)` with the latest prompt only — history is accepted/validated but not yet fed into the agent loop).

### 6.4 Safety / guardrails (why it can't leak or break data)

- **Auth + tenancy**: `AuthGuard` (Clerk JWT → internal user, `isBanned` check) + `ShopRolesGuard` (`owner`/`shop_worker` of that `shopId` only). No cross-shop reads.
- **Read-only by construction**: 5/6 tools are fixed `SELECT`s. `run_custom_sql` is wrapped in `buildScopedSql()`: user SQL becomes a subquery inside shop-filtered CTEs (`shops`, `users`, `shop_products`, `bills`, `bill_items ⨝ scoped bills`, `staff_requests`).
- **Query validation** (`validateCustomSql()`): single statement, must start `SELECT`/`WITH`, rejects `;`, `--`/`/*`, schema-qualified tables, DDL/writes (`INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/...`), and risky funcs (`pg_sleep`, `dblink_*`, `lo_*`, ...). Defense-in-depth: executed inside a `read only` Postgres transaction with `SET LOCAL statement_timeout = 10000`, `LIMIT 50` rows, 12 000-char response cap.
- **Input limits**: prompt 1–2000 chars, SQL 1–2000 chars, agent `maxTokens: 800` (Zod-validated both ends).

### 6.5 Setup

Backend `.env` (see `backend/.env.example`) needs at minimum:

```bash
GROQ_API_KEY=gsk_...                       # or OPENAI_API_KEY if using OpenAI directly
OPENAI_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b              # optional
```

No frontend AI keys are needed — the browser only talks to the NestJS endpoint. Without a key every other feature works; only `POST /api/shops/:id/ai-assistant` returns an LLM error (surfaced in the chat bubble as `⚠️ …`).

### 6.6 Limitations (current)

- Read-only: cannot create bills, edit inventory, invite staff, or change settings — it only *reads and explains*.
- Single-turn execution: `history[]` is sent but the agent is invoked with the latest `prompt` only, so long multi-turn context is limited.
- `maxTokens: 800` + row caps (30/25/50) keep answers fast but truncate very large reports — ask follow-ups (e.g. *"only top 5"*) for big shops.
- Requires network access to Groq/OpenAI; latency/availability follows the provider.

---

## 7. Notes / conventions

- Money is stored as **integer paise** (`mrp`, `unitPrice`, `totalPrice`) — never floats.
- Invoice numbers are unique per shop (`unique_invoice` on `shopId+billNumber`); per-shop `invoicePrefix` + `invoiceCounter` in `shops`.
- Both `.env` files are git-ignored (`backend/.gitignore`, `frontend/.gitignore` list `.env*`); only `.env.example` files are safe to commit.
- Backend falls back gracefully for R2 (`my-bucket` / `pub-xxxx`) but uploads will fail without real R2 creds — everything else works without R2.
- Frontend works without `NEXT_PUBLIC_API_URL` set (falls back to `http://localhost:5000`), but Clerk keys are mandatory for any authenticated page.
