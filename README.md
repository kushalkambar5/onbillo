<div align="center">

<img src="frontend/public/favicon.svg" alt="Onbillo logo" width="72" />

# Onbillo

**The modern billing & POS built for Indian retail.**

Onbillo is a full-stack point-of-sale and billing platform for Indian retail — kirana and grocery stores, supermarkets, restaurants and cafés, wholesale dealers, and boutiques. It combines barcode billing, a shared global product database, GST-compliant invoicing, multi-shop management with role-based access, sales and inventory analytics, cloud storage, and a database-backed AI Shop Assistant — with PostgreSQL as the source of truth and Clerk authentication throughout.

[![Live Demo](https://img.shields.io/badge/Live_Demo-onbillo.vercel.app-0052FF?style=for-the-badge&logo=vercel&logoColor=white)](https://onbillo.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Aiven-336791?logo=postgresql&logoColor=white)](https://aiven.io/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-OpenAI_compatible-F55036?logo=groq&logoColor=white)](https://groq.com/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-Object_storage-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/developer-platform/r2/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://vercel.com/)

**[🚀 Live Demo](https://onbillo.vercel.app/) · [🤖 AI Assistant](#ai-shop-assistant) · [🏗 Architecture](#architecture) · [🚦 Getting Started](#getting-started)**

</div>

## Contents

- [Overview](#overview)
- [Product Preview](#product-preview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [AI Shop Assistant](#ai-shop-assistant)
- [AI Security & Guardrails](#ai-security--guardrails)
- [Product Innovation](#product-innovation)
- [Deployment](#deployment)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [AI Coding Tools Used](#ai-coding-tools-used)
- [Demo Access](#demo-access)
- [Limitations](#limitations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Overview

Small retail businesses in India — kiranas, supermarkets, cafés, wholesalers, boutiques — often juggle fragmented billing software, manual stock registers, and tax calculations that don't fit how they actually sell. Onbillo replaces that patchwork with one system: a fast POS register with camera barcode scanning, a shared product catalog so a barcode only ever needs to be entered once, GST-aware invoices with per-shop numbering, staff and multi-shop management, revenue and inventory analytics, and an AI assistant that answers questions using live shop data instead of guesses.

The stack is deliberately conventional and production-minded: a **Next.js 16 (App Router) + React 19** frontend, a **NestJS 11** REST API, **PostgreSQL** (managed by Aiven) accessed through **Drizzle ORM**, **Clerk** for authentication with Svix-verified user-sync webhooks, **Cloudflare R2** for image storage, and **Groq's OpenAI-compatible API** driving the assistant through the **OpenAI Agents SDK**. Money is stored as integer paise throughout, every shop-scoped record is authorized server-side, and the AI layer is read-only by construction.

---

## Product Preview

> No product screenshots are checked into the repository yet, so this section deliberately contains no images rather than mockups. To complete it, capture the pages below from the deployed app and save them at the listed paths.

```
docs/screenshots/dashboard.png      # /shop/[shopId]/dashboard — revenue + stock overview
docs/screenshots/billing.png        # /shop/[shopId]/billing — POS register with barcode scan
docs/screenshots/ai-assistant.png   # /shop/[shopId]/ai_assistant — AI Shop Assistant chat
docs/screenshots/analytics.png      # analytics views — summary, top products, sales trend
```

Suggested layout once the files exist:

| Dashboard | Billing / POS |
|---|---|
| `docs/screenshots/dashboard.png` | `docs/screenshots/billing.png` |

| AI Shop Assistant | Analytics |
|---|---|
| `docs/screenshots/ai-assistant.png` | `docs/screenshots/analytics.png` |

Brand assets already in the repo: `frontend/public/favicon.svg` (logo, used above), `frontend/public/onbillo_ai_icon.png` (assistant icon), and the shop-category illustrations under `frontend/public/supportings/` used by the landing page.

---

## Key Features

### 🧾 Billing & POS

- Camera barcode scanning via `react-zxing` (EAN-13/8, UPC-A/E, Code 128/39/93, Codabar, ITF, QR) plus manual search/entry
- GST-aware billing with per-shop modes: `gst_inclusive`, `gst_exclusive`, `no_tax`
- Invoice template selection (`invoice_templet` `1`–`7`), with 3-inch thermal receipts and A4/A5 print layouts (`frontend/app/components/templates/`)
- Automatic per-shop invoice numbering from `invoicePrefix` + `invoiceCounter` (e.g. `INV/42`), unique per shop
- Bill cancellation flow (owner-only), itemized bills with paise-exact line totals

### 📦 Inventory

- Shared **global product database**: barcode-unique catalog with `pending` / `approved` / `rejected` moderation
- Per-shop catalog (`shop_products`) with own `unitPrice`, `quantity`, and `isActive` flag
- Low-stock detection (`quantity <= 5`), used across inventory views and the AI assistant
- Product and shop-logo images stored on Cloudflare R2 via `POST /api/upload` (5 MB, png/jpg/gif/webp)

### 🏪 Shop Management

- Multi-shop support with per-shop settings: GST number, tax rate, currency, invoice template/prefix/counter, logo, footer text
- Roles: `app_admin` / `shop_owner` / `shop_worker` globally, enforced as `owner` / `shop_worker` at the shop level
- Staff invite flow: invite by email, accept/reject, pending-request tracking

### 📊 Analytics

- Revenue summary (today's sales, 7-day sales, total active bills)
- Top 5 products by quantity sold (last 30 days)
- 7-day daily revenue trend

### 🤖 AI Shop Assistant

- Per-shop chat at `/shop/[shopId]/ai_assistant`, powered by Groq + the OpenAI Agents SDK
- 6 shop-scoped, read-only tools: shop details, inventory, recent bills, analytics summary, staff, and sandboxed custom SQL for ad-hoc reports
- Suggested prompts, markdown answers in ₹, clear-chat, `Enter` to send / `Shift+Enter` for newline

### ☁️ Platform

- Deployed frontend + API on Vercel, managed PostgreSQL on Aiven, object storage on Cloudflare R2
- Clerk authentication end to end (session JWTs, JIT provisioning, Svix webhooks)
- Frontend resilience: the POS register caches the shop catalog in `localStorage` so a flaky connection doesn't blank the screen; PostgreSQL remains the source of truth

---

## Tech Stack

![Tech Stack](https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,nodejs,nestjs,postgres,vercel,cloudflare)

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Axios, `react-zxing`, Clerk (`@clerk/nextjs` 7.x) |
| **Backend** | NestJS 11, Node.js, Drizzle ORM 0.45, `postgres` (postgres-js), Zod validation, Clerk (`@clerk/backend` 3.x) + Svix webhooks |
| **AI** | Groq via OpenAI-compatible endpoint (`https://api.groq.com/openai/v1`), OpenAI Agents SDK 0.18 (`Agent`, `run`, `tool`), default model `openai/gpt-oss-20b` |
| **Infrastructure** | Vercel (frontend + serverless API), Aiven (managed PostgreSQL), Cloudflare R2 (S3-compatible storage), Clerk (auth), Svix (webhook signatures) |

---

## Architecture

Monorepo with two apps (no shared package): `backend/` (NestJS 11, port 5000) and `frontend/` (Next.js 16 App Router, port 3000).

```mermaid
flowchart TD
    Browser["User browser"]
    Frontend["Next.js frontend<br/>Vercel"]
    Clerk["Clerk<br/>sessions + Svix webhooks"]
    Backend["NestJS API<br/>Vercel serverless"]
    Guards["AuthGuard + ShopRolesGuard"]
    Modules["Shops · Products · Bills<br/>Staff · Analytics · Upload"]
    AI["AI Assistant<br/>OpenAI Agents SDK"]
    ORM["Drizzle ORM"]
    DB[("Aiven PostgreSQL")]
    R2[("Cloudflare R2")]
    LLM["Groq OpenAI-compatible API"]

    Browser --> Frontend
    Frontend -->|"REST /api/* + Bearer JWT"| Backend
    Clerk -->|"user.* webhook (Svix-signed)"| Backend
    Backend --> Guards --> Modules
    Modules --> AI --> LLM
    AI --> ORM
    Modules --> ORM --> DB
    Modules --> R2
```

How a request flows:

1. The browser (Next.js) attaches the Clerk session JWT as `Authorization: Bearer` on every API call (`frontend/app/utils/api/client.ts`).
2. `AuthGuard` (`backend/src/auth/auth.guard.ts`) verifies the token with `CLERK_SECRET_KEY`, loads the internal `users` row by `clerkId` (with just-in-time provisioning if the webhook hasn't landed yet), and enforces `isBanned` / `isPremium` gates.
3. `ShopRolesGuard` checks shop membership: the user's `shopId` must equal the route's `shopId`, and their role must satisfy the route's `@ShopRoles(...)` metadata.
4. Controllers validate input with Zod (`ZodValidationPipe` + per-module schemas), services query via Drizzle, and uploads go to Cloudflare R2.
5. Separately, Clerk fires `user.created` / `user.updated` / `user.deleted` webhooks to `POST /api/webhooks/clerk`, verified against the raw request body with `CLERK_WEBHOOK_SECRET`, which auto-provision the `users` table.

Key files: `backend/src/main.ts` (local bootstrap, permissive CORS), `backend/api/index.ts` (Vercel serverless entrypoint, raw body preserved for webhook verification), `backend/src/db/db.service.ts` (connection), `drizzle.config.ts` (migration config).

---

## Database Design

Schema lives in `backend/src/db/schema.ts` — 7 tables, UUID primary keys, Drizzle ORM over `postgres` (postgres-js).

```mermaid
erDiagram
    users ||--o{ shops : "createdBy"
    users }o--|| shops : "shopId membership"
    shops ||--o{ shop_products : has
    products ||--o{ shop_products : listed_in
    shops ||--o{ bills : has
    bills ||--o{ bill_items : contains
    shop_products ||--o{ bill_items : sold_as
    shops ||--o{ staff_requests : invites
    users ||--o{ staff_requests : "requestedBy / requestedTo"
```

| Table | Holds | Key relationships |
|---|---|---|
| `users` | `clerkId` (unique), email (unique), phone, name, `role`, `shopId`, `isPremium`, `isBanned` | `shopId` → `shops.id` (`SET NULL` on delete); one active shop membership per user |
| `shops` | Identity + address, GST number, `taxType` / `taxRate`, `invoiceTemplet`, `invoicePrefix` / `invoiceCounter`, logo, footer | `createdBy` → `users.id` (`SET NULL`) |
| `products` | Global catalog: `barcode` (unique, indexed), name, brand, category, image, `mrp`, `status`, rejection reason | `createdBy` → `users.id` (`SET NULL`) |
| `shop_products` | Per-shop listing: `unitPrice`, `quantity`, `isActive`, indexed on (`shopId`, `productId`) | → `shops.id` / `products.id` (both `CASCADE`) |
| `bills` | `billNumber`, `totalPrice`, notes, template used, `status`, indexed on `shopId` + `createdAt` | → `shops.id` (`CASCADE`), `createdBy` → `users.id` (`SET NULL`) |
| `bill_items` | Line-item snapshot: `unitPrice`, `quantity` | → `bills.id` (`CASCADE`), → `shop_products.id` |
| `staff_requests` | Invite: `role`, `status`, unique (`shopId`, `requestedTo`) | → `shops.id` (`CASCADE`), `requestedBy` / `requestedTo` → `users.id` (`CASCADE`) |

Enums: `user_role` (`app_admin`, `shop_owner`, `shop_worker`), `shop_member_role` (`owner`, `shop_worker`), `currency` (`rupees`), `tax_type` (`gst_inclusive`, `gst_exclusive`, `no_tax`), `invoice_templet` (`1`–`7`), `product_status` (`pending`, `approved`, `rejected`), `bill_status` (`active`, `cancelled`), `request_status` (`pending`, `accepted`, `rejected`).

Deliberate design decisions:

- **Money as integer paise** (`mrp`, `unitPrice`, `totalPrice`) — never floats, so totals stay exact.
- **Unique bill numbering per shop** (`unique_invoice` on `shopId` + `billNumber`); numbers are generated from the shop's own `invoicePrefix` + auto-incremented `invoiceCounter` in `BillsService`.
- **Shop-scoped everything**: bills, listings, and invites all carry `shopId` with cascade deletes, so removing a shop removes its operational data.
- **Bill items snapshot prices** at sale time, so later catalog price changes don't rewrite history.
- **One pending invite per user per shop** via the `unique_shop_requested_to` constraint.

---

## AI Shop Assistant

The assistant at `frontend/app/shop/[shopId]/ai_assistant/page.tsx` is **not a bare LLM chatbot** — it is an agent loop over real application tools. Every answer about inventory, bills, staff, or revenue comes from a Drizzle query against PostgreSQL, scoped to the current shop.

```mermaid
flowchart LR
    UI["Next.js chat UI"] -->|"POST prompt + history<br/>+ Clerk JWT"| EP["NestJS endpoint"]
    EP --> G["AuthGuard + ShopRolesGuard<br/>+ Zod validation"]
    G --> A["Agent: Onbillo Shop Assistant<br/>GROQ_MODEL · maxTokens 800"]
    A --> T["6 shop-bound tools<br/>each closes over shopId"]
    T --> DB2[("PostgreSQL<br/>via Drizzle")]
    DB2 --> T --> A --> UI
```

Request flow in code (`backend/src/ai-assistant/`): the chat UI calls `aiAssistantApi.sendMessage()` → `POST /api/shops/:id/ai-assistant` with `{ prompt (1–2000 chars), history[] }` → `AuthGuard` (Clerk) + `ShopRolesGuard` (`owner` | `shop_worker`) + `AiAssistantPromptSchema` → `AiAssistantService.processPrompt()` builds an `Agent` with a shop-aware system prompt (INR ₹ formatting, bullets/tables, low-stock `<= 5`) and runs it with `createShopTools(shopId)`.

| Tool | Parameters | Data accessed |
|---|---|---|
| `get_shop_details` | — | `shops` by id: name, address, GST/tax settings, invoice prefix/counter |
| `get_shop_inventory` | `searchQuery?`, `lowStockOnly?` | `shop_products` ⨝ `products`, paise → `₹` formatted, `isLowStock = qty <= 5`, capped at 30 rows |
| `get_recent_bills` | `limit?` (default 10, cap 25) | `bills` by `shopId`, newest first, totals in ₹ |
| `get_shop_analytics_summary` | — | Active-bill revenue total, active-bill count, active-product count, low-stock count |
| `get_staff_members` | — | `users` by `shopId` + pending `staff_requests` ⨝ `users` |
| `run_custom_sql` | `query` (1–2000 chars, single `SELECT`/`WITH`) | Sandboxed read-only SQL auto-scoped to the shop (see guardrails); ≤ 50 rows |

The chat UX ships with a capability greeting, 4 suggested prompts (`Show me low stock items`, `Summarize today's sales`, `How many products do I have?`, `Show shop analytics`), a loading indicator, `Enter`/`Shift+Enter` handling, clear-chat, and lightweight `**bold**` + bullet rendering.

Setup needs only backend env (no frontend AI keys — the browser only talks to NestJS):

```bash
GROQ_API_KEY=gsk_...                        # or OPENAI_API_KEY when pointing at OpenAI directly
OPENAI_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b               # optional, this is the default
```

---

## AI Security & Guardrails

Secure per-shop AI access is a first-class concern here, handled with defense-in-depth controls that reduce the risk of cross-tenant data access (no system can honestly claim to be unhackable, so the design assumes prompts are adversarial):

- **Authentication first**: every assistant call passes `AuthGuard` — a missing/invalid Clerk JWT is rejected before any shop code runs, and banned/non-premium users are gated.
- **Server-side authorization**: `ShopRolesGuard` requires the caller's `users.shopId` to equal the URL's shop id with an `owner` / `shop_worker` role. There is no frontend-only authorization to bypass.
- **Tools close over `shopId`**: the five fixed tools pre-filter every query (`eq(shopProducts.shopId, shopId)` etc.). A crafted prompt cannot change which shop the tool reads — the model never supplies the tenant id.
- **Read-only custom SQL**: `run_custom_sql` wraps user SQL as a subquery inside shop-filtered CTEs (`shops`, `users`, `shop_products`, `bills`, scoped `bill_items`, `staff_requests`), and `validateCustomSql()` rejects multiple statements (`;`), comments, schema-qualified tables, writes/DDL (`INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/…`), and risky functions (`pg_sleep`, `dblink_*`, `lo_*`, …). Only `SELECT`/`WITH` passes.
- **Execution sandbox**: the query runs inside a `read only` Postgres transaction with a 10 s `statement_timeout`, a 50-row `LIMIT`, and a 12 000-character response cap.
- **Input/output budgets**: prompt 1–2000 chars, SQL 1–2000 chars, agent `maxTokens: 800` — all validated with Zod on both ends.
- **Secrets stay server-side**: Groq/OpenAI keys live only in backend env; the frontend never sees them.

---

## Product Innovation

**Innovation: the shared Global Product Database — "scan once, everyone benefits."**

1. **What it is.** A barcode-unique, moderated (`pending` / `approved` / `rejected`) product catalog shared across all shops (`products` table + `GET/POST /api/products`, barcode lookup, and an app-admin approval queue). A shop links a global product into its own priced listing (`POST /api/shops/:shopId/products`, plus `POST …/products/custom` for shop-specific items) instead of re-entering master data. The landing page foregrounds this as the product's signature feature, with its own mockup section and illustrations (`scan_once_everyone_benefits.png`).
2. **Why it matters.** For a kirana or supermarket cashier, onboarding inventory is the slowest part of adopting billing software. Scanning an already-known barcode pulls name/brand/category/MRP instantly — seconds instead of minutes per SKU.
3. **How it works technically.** `products.barcode` is unique + indexed for fast scan lookups; `shop_products` keeps per-shop price/stock independent of the shared master row; admin moderation endpoints (`/api/admin/products/...`) gate quality without blocking shop-local custom products.
4. **Why it's different.** A baseline billing task stores products per shop in isolation. Onbillo adds a network effect: every shop that contributes a barcode makes onboarding faster for the next shop, while per-shop pricing keeps commercial independence.

Worth noting alongside it: the **sandboxed custom-SQL reporting tool** (ad-hoc revenue/staff/stock reports without new endpoints) and the **resilient POS register** (camera scanning + cached catalog + thermal printing in one billing page).

---

## Deployment

| Component | Platform | Address / identifier | Purpose |
|---|---|---|---|
| **Frontend** (Next.js) | Vercel | https://onbillo.vercel.app/ | Landing page, Clerk sign-in/sign-up, POS, dashboards, admin console |
| **Backend** (NestJS) | Vercel (serverless) | https://onbillobackend.vercel.app/ | All REST APIs under `/api/*` |
| **Database** | Aiven (managed PostgreSQL) | via backend `DATABASE_URL` (`sslmode=require`) | Source of truth; Drizzle ORM; migrations via `npx drizzle-kit push` |
| **Object storage** | Cloudflare R2 | bucket `onbillo-uploads`, served via `R2_PUBLIC_URL` | Shop logos, product images; no images live on Vercel |
| **Auth** | Clerk | — | Sessions, JWTs, `user.*` sync webhooks |
| **AI** | Groq (OpenAI-compatible) | default base `https://api.groq.com/openai/v1`, model `openai/gpt-oss-20b` | AI Shop Assistant LLM |

### 🚀 Live Demo

**App: [https://onbillo.vercel.app/](https://onbillo.vercel.app/)** · API: [https://onbillobackend.vercel.app/](https://onbillobackend.vercel.app/)

Production wiring notes:

- The frontend's `NEXT_PUBLIC_API_URL` is set to `https://onbillobackend.vercel.app` (locally it falls back to `http://localhost:5000` — see `frontend/app/utils/api/client.ts`).
- The backend deploys from `backend/` via the serverless entrypoint `api/index.ts`; controllers keep their `api/...` prefixes, so routes are reachable at `https://onbillobackend.vercel.app/api/...`.
- The Clerk webhook endpoint registered in the Clerk Dashboard is `https://onbillobackend.vercel.app/api/webhooks/clerk`.
- No connection strings, keys, or secrets are documented here — they live in Vercel project env vars.

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ locally, or a hosted connection string (production uses Aiven)
- A [Clerk](https://dashboard.clerk.com) application (dev keys are fine)
- Optional: a Cloudflare R2 bucket + API token (only needed for image uploads)
- Optional: a Groq API key (only needed for the AI Shop Assistant)

### 1. Clone and install

```bash
git clone <repo-url> onbillo
cd onbillo

# Backend
cd backend
npm install
cp .env.example .env        # then fill in values (see Environment Variables)

# Frontend (new terminal, from repo root)
cd frontend
npm install
cp .env.example .env        # then fill in values (see Environment Variables)
```

### 2. Backend

```bash
cd backend
node create-db.js           # creates the `onbillo` database from DATABASE_URL
npx drizzle-kit push        # sync the schema in src/db/schema.ts
npm run start:dev           # watch mode → http://localhost:5000
# npx drizzle-kit studio    # optional DB UI
```

### 3. Frontend

```bash
cd frontend
npm run dev                 # → http://localhost:3000
```

Sign in with Clerk, complete onboarding (profile + phone + first shop), and open `/shop/[shopId]/billing` to start billing. For local Clerk webhooks, expose the backend (e.g. `ngrok http 5000`) and register `https://<ngrok-url>/api/webhooks/clerk` in the Clerk Dashboard so sign-ups create `users` rows (the guard also JIT-provisions on first authenticated request).

---

## Environment Variables

### Backend — `backend/.env` (create from `backend/.env.example`)

| Variable | Required | Where used | Value |
|---|---|---|---|
| `PORT` | No (defaults to `5000` in `src/main.ts`) | `src/main.ts` | `5000` to match the frontend default |
| `FRONTEND_URL` | No | Declared in `.env.example` as the public frontend URL (not read by backend code; local CORS is permissive) | `https://onbillo.vercel.app` in production |
| `DATABASE_URL` | **Yes** | `src/db/db.service.ts`, `drizzle.config.ts`, helper scripts | `postgresql://USER:PASSWORD@HOST:5432/onbillo` (`?sslmode=require` for Aiven) |
| `CLERK_SECRET_KEY` | **Yes** | `src/auth/auth.guard.ts` | Clerk Dashboard → API Keys → Secret Key |
| `CLERK_WEBHOOK_SECRET` | **Yes** | `src/webhooks/webhooks.controller.ts` | Clerk Dashboard → Webhooks → Signing Secret for `…/api/webhooks/clerk` |
| `R2_BUCKET` | For uploads | `src/upload/upload.service.ts` | e.g. `onbillo-uploads` |
| `R2_PUBLIC_URL` | For uploads | `src/upload/upload.service.ts` | e.g. `https://pub-xxxx.r2.dev` |
| `R2_ENDPOINT` | For uploads | `src/upload/upload.service.ts` | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | For uploads | `src/upload/upload.service.ts` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | For uploads | `src/upload/upload.service.ts` | R2 API token secret |
| `GROQ_API_KEY` | For AI Assistant | `src/ai-assistant/ai-assistant.service.ts` (falls back to `OPENAI_API_KEY`) | Groq Console → API Keys |
| `OPENAI_API_KEY` | For AI Assistant | `src/ai-assistant/ai-assistant.service.ts` (Agents SDK auth) | Same key as `GROQ_API_KEY` when using Groq |
| `OPENAI_BASE_URL` | No (defaults to `https://api.groq.com/openai/v1`) | `src/ai-assistant/ai-assistant.service.ts` | Keep for Groq, or `https://api.openai.com/v1` for OpenAI |
| `GROQ_MODEL` | No (defaults to `openai/gpt-oss-20b`) | `src/ai-assistant/ai-assistant.service.ts` | e.g. `openai/gpt-oss-20b` |

Only non-secret defaults are pre-filled in `.env.example`; all secrets are empty for you to add. Both `.env` files are git-ignored — never commit them.

### Frontend — `frontend/.env` (create from `frontend/.env.example`)

| Variable | Required | Where used | Value |
|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | `ClerkProvider` in `app/layout.tsx` | Clerk Dashboard → API Keys → Publishable Key |
| `CLERK_SECRET_KEY` | **Yes** | Server components / auth | Same Clerk secret as the backend |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Clerk redirects | `/sign-in` (matches `app/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Clerk redirects | `/sign-up` (matches `app/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | Post-login landing | `/` (`HomeRedirect` routes onward to shop/onboarding) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | Post-signup landing | `/onboarding` |
| `NEXT_PUBLIC_API_URL` | No (falls back to `http://localhost:5000` in `app/utils/api/client.ts`) | All API calls | `http://localhost:5000` locally; `https://onbillobackend.vercel.app` in production |

---

## Backend Scripts & Production Build

Useful helpers from `backend/` (all read `DATABASE_URL` via `dotenv`):

```bash
node test-db.js        # sanity-check the DB connection
node clear-db.js       # wipe all app tables (dev only!)
node update-premium.js # bulk premium-flag maintenance
npm run build && npm run start:prod  # production backend (node dist/main)
npx drizzle-kit push   # sync schema changes to the database
npx drizzle-kit studio # visual DB browser
```

---

## Project Structure

```
onbillo/
├── backend/                 # NestJS 11 API (port 5000)
│   ├── api/index.ts         # Vercel serverless entrypoint
│   ├── drizzle.config.ts    # Drizzle Kit config (schema → ./drizzle)
│   ├── drizzle/             # migrations / push output
│   ├── create-db.js / test-db.js / clear-db.js / update-premium.js
│   └── src/
│       ├── main.ts app.module.ts        # bootstrap (local) + root module
│       ├── auth/            # AuthGuard (Clerk JWT), ShopRolesGuard, current-user decorator
│       ├── webhooks/        # Clerk Svix webhook → users provisioning
│       ├── db/              # schema.ts, DbService / DbModule
│       ├── shops/ products/ bills/ staff/ analytics/ admin/ users/
│       ├── ai-assistant/    # controller + agent service + 6 shop-scoped tools
│       ├── upload/          # R2 image upload (5 MB validated)
│       └── common/          # exception filter, Zod pipe, validation schemas
├── frontend/                # Next.js 16 App Router (port 3000)
│   └── app/
│       ├── page.tsx layout.tsx          # landing page + ClerkProvider root layout
│       ├── sign-in/ sign-up/            # Clerk hosted auth
│       ├── onboarding/                  # profile + phone + first shop
│       ├── shop/[shopId]/               # dashboard, billing, inventory,
│       │                                # bills, staff, settings, ai_assistant
│       ├── admin/ invites/ profile/     # admin console, staff invites, user profile
│       ├── components/                  # scanner, receipts, invoice templates,
│       │                                # landing sections, theme + redirect helpers
│       └── utils/api/                   # client.ts + shops/products/bills/
│                                        # staff/users/admin/aiAssistant/types
└── README.md
```

---

## API Overview

No global prefix — each controller declares its own route. All API controllers except `api/webhooks/clerk` require `Authorization: Bearer <Clerk JWT>` (`AuthGuard`), plus shop membership where marked (`ShopRolesGuard`).

| Area | Base route | Endpoints |
|---|---|---|
| Shops | `api/shops` | `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| Shop catalog | `api/shops/:shopId/products` | `GET /`, `POST /`, `POST /custom`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/stock`, `GET /barcode/:code` |
| Global products | `api/products` | `GET /`, `GET /barcode/:code`, `POST /`, `PUT /:id`, `PUT /verify/:id`, `DELETE /:id` |
| Bills | `api/shops/:shopId/bills` | `POST /`, `GET /`, `GET /:id`, `PUT /:id/cancel` (cancel: owner only) |
| Staff | `api/shops/:shopId/staff` | `GET /`, `GET /invites`, `POST /invite`, `POST /:user_id`, `PUT /accept`, `PUT /:id`, `DELETE /:id` |
| My invites | `api/staff/invites` | `GET /`, `PUT /:id` (accept / reject) |
| Analytics | `api/shops/:shopId/analytics` | `GET /summary`, `GET /top-products`, `GET /sales-trend` (owner / app_admin) |
| AI assistant | `api/shops/:shopId/ai-assistant` | `POST /` (owner / shop_worker) |
| Uploads | `api/upload` | `POST /` (image ≤ 5 MB), `DELETE /:key` |
| Users | `api/users` | `GET /me`, `PUT /me` (phone onboarding) |
| Admin | `api/admin` | `GET /stats`, `GET /users`, `PUT /users/:id/premium`, `PUT /users/:id/ban`, `GET /shops`, product moderation (`pending` / `rejected` lists, `approve` / `reject` / `pending`) |
| Webhooks | `api/webhooks/clerk` | `GET /` (route health), `POST /` (Svix-verified Clerk `user.*` events) |

All request bodies and UUID params are validated with Zod (`backend/src/common/validation/schemas.ts`); failures return structured errors via the global exception filter.

---

## AI Coding Tools Used

No AI-coding-tool usage is recorded anywhere in the repository (no config, logs, or attributions to draw on), so no specific tools are claimed here.

---

## Demo Access

There are no public demo credentials embedded in the repository. Authentication is handled by Clerk, so a reviewer can sign up directly on the live deployment:

**[https://onbillo.vercel.app/](https://onbillo.vercel.app/)** — sign up, complete onboarding, and create a shop to explore billing, inventory, analytics, and the AI assistant.

Support: `support@onbillo.com`

---

## Limitations

- **AI is read-only**: it cannot create bills, edit inventory, invite staff, or change settings — it only reads and explains.
- **Single-turn execution**: `history[]` is sent by the UI but the agent is currently invoked with the latest `prompt` only, so long multi-turn context is limited.
- **Response budgets**: `maxTokens: 800` plus row caps (inventory 30, bills 25, custom SQL 50 rows / 12 000 chars) keep answers fast but truncate very large reports — ask follow-ups (e.g. *"only top 5"*) for big shops.
- **Provider dependency**: the assistant needs network access to Groq/OpenAI plus a configured key; without one, every other feature works and only `POST /api/shops/:id/ai-assistant` returns an LLM error (surfaced in chat as `⚠️ …`).
- **Uploads need R2**: without real R2 credentials, image uploads fail while everything else works.
- Billing figures come from user-entered data and shop settings — verify independently for tax filing (see the landing page's own GST disclaimer).

---

## Future Improvements

Unimplemented ideas drawn from the current limitations — not shipped features:

- Richer multi-turn agent context (feed validated `history[]` into the agent loop)
- Write-capable AI actions with explicit user confirmation (draft bill, stock adjust, staff invite)
- Broader automated test coverage (Jest is configured in `backend/` around a starter spec)
- Inventory forecasting and low-stock notifications
- CI/CD checks, error monitoring, and uptime alerting for the Vercel deployments
- Fuller offline sync (queued bill submission) beyond the current catalog caching

---

## Contributing

1. Fork the repo and create a feature branch.
2. Keep money in integer paise, keep new routes shop-scoped with `AuthGuard` + `ShopRolesGuard`, and validate input with the shared Zod schemas.
3. Open a pull request describing the change and how you tested it (backend `npm test`, frontend `npm run lint` / `next build`).

---

## License

No `LICENSE` file is currently present in the repository.

---

## Notes & Conventions

- Fallback values in code (`my-bucket` / `pub-xxxx` for R2, `http://localhost:5000` for the API base) are local-dev conveniences — production must set real env vars.
- Clerk keys are mandatory for every authenticated page; public surface is limited to the landing page and sign-in/sign-up.
- Phone numbers are validated as `+91` followed by exactly 10 digits (`PhoneSchema`); invoice notes/product names use an allowlist character regex enforced by Zod on both ends.
