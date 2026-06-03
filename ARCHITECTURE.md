# num_zer0 Architecture

## Overview

**num_zer0** is a full-stack web application for purchasing phone number verifications (WhatsApp, Telegram, etc.) across 70+ countries. Users recharge a USD wallet via Cameroonian mobile money (Fapshi) and use credits to buy virtual numbers for SMS verification codes. The app includes a double-entry accounting system for financial transparency.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 6, TanStack Start (SSR), TanStack Router (file-based), TanStack Query |
| **Styling** | Tailwind CSS 4, shadcn/ui primitives (Base UI), custom CSS variables |
| **Backend** | Convex (reactive DB + serverless functions) |
| **Auth** | better-auth (email/password + anonymous) via `@convex-dev/better-auth` |
| **Payments** | Fapshi API (Cameroonian mobile money — MTN MoMo, Orange Money) |
| **Build** | Vite 8, Bun |
| **Linting** | ESLint (tanstack config), Prettier |
| **Deploy** | Nitro server adapter |

---

## Directory Structure

```
num_zer0/
├── convex/                          # Convex backend (database + server functions)
│   ├── _generated/                  # Auto-generated Convex types
│   ├── schema.ts                    # Database schema (7 tables)
│   ├── auth.ts                      # better-auth setup + hooks
│   ├── auth.config.ts               # Auth provider config
│   ├── convex.config.ts             # Convex app definition (uses better-auth component)
│   ├── users.ts                     # User queries/mutations (balance, access, admin)
│   ├── purchases.ts                 # Payment flow (Fapshi integration, webhooks)
│   ├── comptabilite.ts             # Double-entry accounting (comptes, pieces, lignes)
│   ├── analytics.ts                 # Event tracking (visits, clicks, sessions)
│   └── http.ts                      # HTTP routes (auth routes, Fapshi webhook)
├── src/
│   ├── router.tsx                   # TanStack Router setup + SSR + Convex Query integration
│   ├── routeTree.gen.ts             # Auto-generated route tree
│   ├── seo.ts                       # SEO meta definitions
│   ├── global.css                   # Tailwind + custom theme (light/dark)
│   ├── routes/                      # File-based routing
│   │   ├── __root.tsx               # Root layout + auth SSR + theme script
│   │   ├── (landing)/               # Public landing pages
│   │   │   ├── route.tsx            # Layout wrapper
│   │   │   └── index.tsx            # Landing page (hero, features, FAQ, footer)
│   │   ├── (app)/                   # Authenticated app pages
│   │   │   ├── route.tsx            # App layout (bottom nav, drawer)
│   │   │   ├── my-space.tsx         # Main dashboard (services list)
│   │   │   ├── wallet.tsx           # Wallet/balance management
│   │   │   ├── recharge.tsx         # Top-up panel trigger
│   │   │   ├── account.tsx          # Profile + delete account
│   │   │   ├── support.tsx          # Customer support
│   │   │   └── login.tsx            # (implied via auth modal)
│   │   ├── admin.tsx                # Admin dashboard
│   │   ├── convert.tsx              # Anonymous → permanent account conversion
│   │   └── api/                     # API routes
│   │       └── auth/                # Auth API endpoints (better-auth SSR)
│   ├── components/                  # Feature-scoped components
│   │   ├── landing/                 # Landing page (hero, features, navbar, FAQ, etc.)
│   │   ├── auth/                    # Auth modals, access banner, convert page
│   │   ├── layout/                  # App layout (bottom nav, header, drawer)
│   │   ├── spa/                     # My Space (service activation flow)
│   │   ├── wallet/                  # Wallet (balance, transactions, payment)
│   │   ├── recharge/                # Recharge drawer (payment methods, top-up)
│   │   ├── purchases/               # Purchase hooks
│   │   ├── account/                 # Profile form, delete account, logout
│   │   ├── admin/                   # Admin dashboard
│   │   ├── services/                # Service/country data definitions
│   │   └── support/                 # Support contact options
│   ├── common/                      # Shared elements
│   │   ├── ui/                      # ~59 shadcn/ui primitives (button, dialog, form, etc.)
│   │   ├── provider/                # Convex provider wrapper
│   │   ├── hooks/                   # Shared hooks (use-mobile)
│   │   ├── css.ts                   # CSS utility helpers
│   │   ├── default-catch-boundary.tsx
│   │   ├── not-found.tsx
│   │   └── top-loader.tsx           # Route transition loader
│   ├── lib/                         # Pure utilities
│   │   ├── utils.ts                 # cn() helper (clsx + tailwind-merge)
│   │   ├── auth-client.ts           # better-auth browser client
│   │   ├── auth-server.ts           # better-auth SSR helpers
│   │   ├── result.ts                # Rust-style Result<T, E> type
│   │   └── trackers.ts              # Client-side analytics tracker
│   └── type/                        # TypeScript domain types
│       ├── service.ts               # ServiceItem, CountryItem, SubProviderDetail
│       ├── purchase.ts              # Package, CreatePurchaseInput, CreatePurchaseResponse
│       └── activation.ts            # ActivationInfo, RequestActivationInput
├── public/                          # Static assets
├── .env.example                     # All env vars documented
├── eslint.config.js                 # ESLint (tanstack config + 200-line rule)
├── prettier.config.js               # Prettier (no semi, single quote, trailing comma)
├── tsconfig.json                    # TypeScript strict, path aliases (#/*, @/*)
├── vite.config.ts                   # Vite (devtools, nitro, tailwind, react compiler)
└── package.json
```

---

## Core Components & Data Flow

### 1. Routing & SSR

```
Request → TanStack Start SSR → Router (file-based, src/routes/)
  → beforeLoad: getAuth() via server fn → set Convex auth token
  → Wrap: <ConvexProvider> → ConvexBetterAuthProvider
  → Outlet renders matched route component
```

- **Root route** (`__root.tsx`): Injects theme script, SSR auth token, TopLoader, devtools, Toaster
- **Landing layout** (`(landing)/route.tsx`): Public-facing pages (no auth required)
- **App layout** (`(app)/route.tsx`): Authenticated experience with bottom navigation + desktop drawer
- **SSR**: Auth token is fetched server-side via `getToken()` and passed to Convex client

### 2. Authentication Flow

```
User visits site
  → Anonymous account auto-created (48h expiry)
  → AccessBanner shows remaining time
  → User can convert to permanent (email + password)
  → Converted users have no expiry
  → Admin: email @numzero.com / first user
```

- **Provider**: better-auth with `anonymous` + `convex` plugins
- **Auth config**: `convex/auth.config.ts` + `convex/auth.ts`
- **Client**: `src/lib/auth-client.ts`
- **SSR**: `src/lib/auth-server.ts` wraps `convexBetterAuthReactStart`
- **User sync**: `databaseHooks.user.create.after` / `update.after` sync to `users` table
- **Anonymous expiry**: 48 hours, tracked per-user

### 3. Payment Flow

```
User selects amount + promo code → initiateDirectPay (Convex action)
  → Validates promo code (internal query)
  → Creates purchase record (status: payment_pending)
  → Calls Fapshi /initiate-pay API
  → Returns payment link to user
  → User completes payment on Fapshi
  → Fapshi webhook → /fapshi-webhook (Convex HTTP action)
  → handlePaymentSuccess → confirms purchase
    → Credits user wallet (XAF→USD conversion)
    → Creates accounting entries (comptabilite)
```

- **Gateway**: Fapshi (Cameroonian fintech)
- **Webhook**: `POST /fapshi-webhook` with `x-wh-secret` header
- **Idempotency**: Each purchase has a unique `idempotencyKey`
- **Promo codes**: Discount % or flat amount, usage limits, expiry dates
- **Verification**: User can also call `verifyPurchase` action to poll status

### 4. Wallet & Accounting System

```
Purchase confirmed
  → Credit computed: priceXAF / 600 = USD
  → Compte client  (411-{userId}) debited
  → Compte revenue (701-recharge) credited
  → Piece comptable created (double-entry journal entry)
```

- **Exchange rate**: 1 USD = 600 XAF (fixed)
- **Accounting tables**: `comptes` (accounts), `pieces` (journal entries), `lignes` (journal lines)
- **Operations**: `creditCompte`, `debitCompte`, `createPiece`, `annulerPiece`
- **Client-facing**: `getMyMouvements` (transaction history), `soldeClient` (balance)

### 5. Analytics Tracking

```
Client-side (trackers.ts):
  → On page load: track 'visit' event
  → On click buy/services: track event
  → On page leave: track 'page_leave' with duration

Server-side (analytics.ts):
  → getAnalyticsSummary: admin-only, aggregates by country/device
```

- **Storage**: `analytics_events` table
- **Session**: `sessionStorage` based `numzero_session_id`
- **Device detection**: User-agent parsing (mobile/tablet/desktop)

### 6. Service Activation Flow

```
User selects service (WhatsApp, Telegram, etc.)
  → Selects country
  → Requests number (credits deducted)
  → Receives phone number + waits for SMS
  → Views activation code
```

- **Pricing**: EUR base rates → XAF markup formula: `ceil(priceEUR * 655.957) + margin`
- **Margin tiers**: <0.5€ → +500 XAF, ≤1€ → +1000 XAF, else +2000 XAF
- **Services**: 10 supported (WhatsApp, Telegram, Viber, Signal, etc.)
- **Countries**: 70+ supported with per-country pricing

---

## Database Schema (Convex)

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `users` | User profiles, balance, access | `by_betterAuthUserId`, `by_email` |
| `analytics_events` | Page visits, clicks, sessions | `by_eventType`, `by_sessionId` |
| `packages` | Recharge packages (slugs, prices) | `by_slug` |
| `purchases` | Payment transactions | `by_userId`, `by_idempotencyKey`, `by_paymentGatewayId` |
| `promoCodes` | Discount codes | `by_code` |
| `comptes` | Accounting accounts | `by_code` |
| `pieces` | Journal entries | — |
| `lignes` | Journal entry lines | `by_piece`, `by_compte` |

---

## External Integrations

| Service | Purpose | Auth |
|---------|---------|------|
| **Fapshi** | Mobile money payments (MTN MoMo, Orange Money) | API key + user |
| **better-auth** | Authentication (email/password + anonymous) | Managed via Convex |
| **Convex** | Database + real-time sync + serverless functions | Deployment token |
| **SMS providers** | Virtual number provisioning | API keys in env |

---

## Configuration

All configuration via environment variables (see `.env.example`):

| Group | Variables |
|-------|-----------|
| **App** | `SITE_URL`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL` |
| **Auth** | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| **Payments** | `FAPSHI_API_KEY`, `FAPSHI_API_USER`, `FAPSHI_ENVIRONMENT`, `FAPSHI_WEBHOOK_SECRET` |
| **SMS** | `SMSONLINEPRO_API_KEY` |
| **Admin** | `ADMIN_EMAILS`, `INTERNAL_API_SECRET` |
| **Email** | `EMAIL_PROVIDER`, `RESEND_API_KEY`, `SMTP_*` |

---

## Build & Deploy

```bash
bun install            # Install dependencies
bun --bun run dev      # Dev server (port 3000)
bun --bun run build    # Production build → dist/
bun --bun run test     # Vitest
bun --bun run lint     # ESLint
bun --bun run format   # Prettier + ESLint --fix
```

- **Dev**: Vite dev server on port 3000
- **Build**: Vite build → Nitro server → self-contained `dist/` directory
- **Deploy**: Push `dist/` to any Node host (Render, Fly.io, VPS)
- **Convex**: Run `npx convex dev` for local backend
