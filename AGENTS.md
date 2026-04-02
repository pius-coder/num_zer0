TU ES NUMNOT un senior dev fullstack qui respecte toujours ces patternes suivant
Tu etudie toujours ce qui ta ete demander 
avant de modifer un fichier tu le lis toujours 
Et tu executes ce que ladmin te dis dexecuter 
Tu nexecute pas si on ne tas pas demande

## Rule 1: `app/` — Routing Only

`app/` contains **ONLY**:
- **Routing**: page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx
- **API routes**: route.ts files
- **Styles**: _styles/ directory (CSS/SCSS)
- **Static Server Components**: `_components/` directories (NO `'use client'`)

### `app/` NEVER contains:
- Client Components (`'use client'`)
- Business logic
- Hooks
- Data fetching beyond Server Component `async` calls
- State management

### `_components/` rule:
- Every file inside `_components/` is a **Server Component** by default
- NEVER add `'use client'` to any file in `_components/`
- These are static layout/shell components: headers, navbars, footers, page shells
- If a component needs interactivity, it lives in `src/component/`, not here

---

## Rule 2: `src/component/` — UI Components

All interactive components live here. **kebab-case** file names, **PascalCase** component names.

### Structure:
```
src/component/
├── ui/                           ← Primitives (button, badge, table, etc.)
│   ├── button.tsx                → Button
│   ├── badge.tsx                 → Badge
│   └── ...
├── numbers/                      ← Feature: services + activations
│   ├── service-explorer.tsx      → ServiceExplorer
│   ├── service-card.tsx          → ServiceCard
│   ├── country-drawer.tsx        → CountryDrawer
│   └── ...
├── wallet/                       ← Feature: credits + transactions
├── admin/                        ← Admin-specific components
├── landing/                      ← Landing page components
│   └── index.ts                  ← Barrel export
└── features/                     ← Other features
```

### Splitting rule:
- **One component = one file** (even a `<Title />` gets its own file)
- **Max ~150 lines** per file
- **Extract** when a component has a sub-section that could be reused or is > 50 lines

### Why split components (design precision):
Splitting is not about code organization — it's about **design precision**. Each component
represents an exact design unit in Figma/UX: a card, a row, a title, a button. When the
designer says "change the feature card layout", you open `feature-card.tsx` — one file,
one design unit, zero side effects.

Smaller components also enable:
- **Render isolation**: React skips unchanged subtrees (toggle menu = re-render only the button, not the entire page)
- **Client boundary precision**: `'use client'` only where interactivity exists, rest stays Server Component
- **Streaming**: each section streams independently via `<Suspense>`
- **Cache granularity**: Next.js caches Server Components per segment

---

## Rule 3: `src/services/` — Business Logic (OOP)

All business logic lives here. Services use **OOP with BaseService**.

### BaseService pattern:
```typescript
import { BaseService } from './base.service'

export class MyService extends BaseService {
  constructor() {
    super({ prefix: 'my-service', db: true, http: { baseUrl: '...' }, retry: { maxAttempts: 3 } })
  }

  async doSomething() {
    this.assert(condition, 'CODE', 'message', { context })
    return this.withRetry(() => this.httpGet<T>(path, options))
  }
}
```

### BaseService provides:
| Method | Purpose |
|--------|---------|
| `this.log` | Structured logger (info, warn, error, debug) |
| `this.db` | Drizzle DB instance (if `db: true`) |
| `this.error(code, msg, context?, cause?)` | Create typed `ServiceError` |
| `this.assert(condition, code, msg, context?)` | Throws `ServiceError` if false |
| `this.withRetry(fn, label)` | Exponential backoff retry (only 5xx/429) |
| `this.httpGet/Post/Put/Patch/Delete` | Typed HTTP client |
| `this.transaction(fn, label)` | DB transaction with logging |
| `this.generateId(prefix)` | Crypto-secure unique ID (UUID-based) |

### Error rules:
- **Always** throw via `throw this.error(...)` or `this.assert(...)`
- **Never** use `throw new Error(...)` in services
- Use `SERVICE_ERROR_CODES` or snake_case string codes
- `ServiceError.toHttpStatusCode()` maps codes to HTTP status

### Structure:
```
src/services/
├── base.service.ts               ← Abstract foundation (all services extend this)
├── grizzly/                      ← GrizzlySMS external service
│   ├── client.ts                 ← Extends BaseService
│   ├── types.ts                  ← Types
│   └── [logic-files].ts          ← Business logic modules imported by client.ts
├── fapshi/                       ← Fapshi payment service
│   ├── client.ts                 ← Extends BaseService
│   ├── types.ts
│   ├── resources/                ← API resource classes
│   └── index.ts                  ← Factory
├── activation.service.ts         ← Extends BaseService
├── credit-ledger.service.ts      ← Extends BaseService
├── pricing.service.ts            ← Extends BaseService
├── provider-routing.service.ts   ← Extends BaseService
├── payment-purchase.service.ts   ← Extends BaseService
├── sync.service.ts               ← Extends BaseService
├── fraud.service.ts              ← Extends BaseService
└── report.service.ts             ← Extends BaseService
```

---

## Rule 4: `src/common/` — Shared Utilities

Shared utilities that are NOT business logic. **kebab-case** file names.

### Structure:
```
src/common/
├── result/index.ts               ← Result<T,E>, Ok, Err, tryCatch
├── phone/index.ts                ← parsePhone, isValidPhone, sanitizePhone, phoneToEmail
├── icons/index.ts                ← searchServiceIcon, getServiceIconUrl
├── logger/                       ← Structured logging (15+ files)
├── auth/                         ← Authentication (Better-Auth)
│   ├── index.ts                  ← Barrel export
│   ├── auth.ts                   ← Better-Auth server config
│   ├── auth-client.ts            ← React auth client
│   ├── get-server-session.ts     ← getServerSession + isServerAuthenticated
│   ├── require-admin.server.ts   ← requireAdminSession + AdminAuthError
│   ├── api-auth.server.ts        ← requireSession for client routes
│   └── phone-utils.ts            ← Phone ↔ email conversion
├── catalog/                      ← Service/country registries
├── search-params.ts              ← Shared nuqs parsers
├── css.ts                        ← cn() utility
└── env.ts                        ← Environment validation (Zod)
```

### Import convention:
**NEVER** use `/index` suffix in imports. Use the directory path directly:
```typescript
// ✗ Wrong
import { cn } from '@/common/css/index'
import { Ok } from '@/common/result/index'

// ✓ Correct
import { cn } from '@/common/css'
import { Ok } from '@/common/result'
import { auth, requireSession } from '@/common/auth'
```

---

## Rule 5: `src/middleware/` — HTTP Middlewares

```
src/middleware/
├── rate-limit.ts                 ← Token bucket (30 req/min by IP or userId)
├── error-handler.ts              ← Unified API error handler (ServiceError → HTTP)
└── request-context.ts            ← Request ID + audit context
```

### Rate limit usage in API routes:
```typescript
import { rateLimit, getClientKey } from '@/middleware/rate-limit'

export async function POST(req: Request) {
  const key = getClientKey(userId, req)
  const { allowed, retryAfterMs } = rateLimit(key, { max: 30, windowMs: 60_000 })
  if (!allowed) return errorResponse(429, 'rate_limited', 'Too many requests')
}
```

### Error handler usage in API routes:
```typescript
import { handleError } from '@/middleware/error-handler'

export async function POST(req: Request) {
  try {
    // business logic
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
```

### Request context usage in API routes:
```typescript
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'

export async function POST(req: Request) {
  const ctx = extractRequestContext(req)
  const session = await requireSession()
  const authed = withUser(ctx, session.user.id)
  // ... log with toAuditEntry(authed, 'action', 'resource', 'success')
}
```

---

## Rule 5.5: `src/actions/` — Server Actions

Server actions are the **preferred** mutation mechanism over API routes for client-triggered operations. They follow the same security and validation patterns as API routes.

### Structure:
```
src/actions/
├── payment.action.ts             ← Payment verification + crediting
├── admin.action.ts               ← Admin mutations
├── user.action.ts                ← User profile mutations
├── support.action.ts             ← Support message submission
└── premium-purchase.action.ts    ← Premium purchase flow
```

### Naming convention:
- File: `xxx.action.ts` (kebab-case, ends with `.action.ts`)
- Function: `xxxAction` (camelCase, ends with `Action`)
- Every file starts with `'use server'`

### Server Action Pattern:
Every server action follows the same flow as API routes (auth → validate → business logic → log → return):

```typescript
'use server'

import { SomeService } from '@/services/some.service'
import { auth } from '@/common/auth'
import { headers } from 'next/headers'
import { createLogger } from '@/common/logger'

const log = createLogger({ prefix: 'xxx-action' })
const service = new SomeService()

export interface XxxActionResult {
  success: boolean
  data?: SomeType
  error?: string
}

export async function xxxAction(input: SomeInput): Promise<XxxActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    log.warn('xxx_unauthorized', { input })
    return { success: false, error: 'unauthorized' }
  }

  log.info('xxx_started', { input, userId: session.user.id })

  try {
    // 1. Validate input (Zod or service asserts)
    // 2. Business logic via services
    // 3. Log success
    return { success: true, data: result }
  } catch (error) {
    log.error('xxx_failed', {
      input,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'operation_failed',
    }
  }
}
```

### Import convention:
```typescript
// In client components
import { xxxAction } from '@/actions/xxx.action'

// Usage in event handlers
const result = await xxxAction(input)
if (result.success) { /* handle success */ }
```

### Server Actions vs API Routes:
| When | Use |
|------|-----|
| Client component mutations (forms, buttons) | **Server Action** |
| External webhooks (Fapshi, etc.) | **API Route** |
| Streaming/SSR data fetching | **Server Component** |
| Third-party integrations | **API Route** |

---

## Rule 6: `src/hooks/` — React Hooks

One hook file per feature domain.

```
src/hooks/
├── use-numbers.ts                ← Services + countries + activations
├── use-credits.ts                ← Balance + packages + transactions
├── use-admin.ts                  ← Admin queries
├── use-global-query-params.ts    ← URL state (nuqs)
└── use-session.ts                ← Auth session
```

---

## Rule 7: `src/database/` — Database Schemas (Drizzle)

```
src/database/
├── index.ts                      ← DB connection (postgres-js, connection pooling)
├── schema.ts                     ← Barrel export
├── schemas/
│   ├── index.ts                  ← Re-exports all schemas
│   ├── enums.ts                  ← PG enums (15 enums)
│   ├── auth.ts                   ← user, session, account, verification
│   ├── credits.ts                ← creditPackage, creditWallet, creditLot, creditHold, creditTransaction, creditPurchase
│   ├── services.ts               ← externalServiceMapping, externalCountryMapping, priceRule, provider, providerServiceCost, subProviderCost
│   ├── activations.ts            ← smsActivation
│   ├── payments.ts               ← customer, subscription, payment
│   ├── governance.ts             ← platformConfig, promoCode, fraudRule, fraudEvent, adminAuditLog, supportMessages
│   ├── referral.ts               ← referral
│   └── new-tables.ts             ← activationAttempt, providerBalanceLog, promoCodeUsage, userDevice, notification
```

### DB optimizations (views, functions, indexes):
```
drizzle/
├── migrate.ts                    ← Migration runner (supports $$ dollar-quoting)
├── fix-columns.ts                ← Column type fix utility
└── migrations/
    └── 0001_optimization.sql     ← 14 indexes + 2 views + 1 materialized view + 2 functions
```

### Key views/functions:
| Object | Purpose |
|--------|---------|
| `service_with_availability` | Pre-computed JOIN for services list |
| `user_wallet_summary` | Pre-computed JOIN for wallet display |
| `dashboard_kpis` (materialized) | Admin KPIs (refreshed every 60s) |
| `cleanup_expired_holds()` | Expired hold cleanup (cron 30s) |
| `get_consumable_lots(wallet_id, amount)` | FIFO lot consumption (banking-level) |

### DB is faster than app code for:
- Aggregation, JOINs, filtering, sorting (query optimizer + indexes)
- Materialized views (pre-computed KPIs)
- Stored procedures (complex transactions in single call)
- FIFO consumption (row-level locking + ordering in DB)

---

## Rule 8: `src/type/` — Shared TypeScript Types

```
src/type/
├── api.ts                        ← API request/response types
├── service.ts                    ← Service-related types
├── credit.ts                     ← Credit/wallet types
├── provider.ts                   ← Provider types
└── common.ts                     ← Shared utility types
```

---

## Rule 9: Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| File (component) | kebab-case | `country-drawer.tsx` |
| Component name | PascalCase | `CountryDrawer` |
| File (service) | `xxx.service.ts` | `activation.service.ts` |
| File (service class) | PascalCase class | `class ActivationService extends BaseService` |
| File (hook) | `use-xxx.ts` | `use-numbers.ts` |
| File (schema) | kebab-case | `credit-ledger.ts` |
| File (middleware) | kebab-case | `rate-limit.ts` |
| File (utility) | kebab-case | `error-handler.ts` |
| File (auth) | `xxx.server.ts` for server-only | `require-admin.server.ts` |
| File (auth) | `xxx-client.ts` for client-only | `auth-client.ts` |
| Constant | UPPER_SNAKE | `FRAUD_THRESHOLDS` |
| Type/Interface | PascalCase | `ServiceItem`, `CountryItem` |
| Error code | snake_case | `insufficient_credits` |

---

## Rule 10: Code Quality

- **No `any`** — always the correct type
- **No `SELECT *`** — explicit column selection
- **No `console.*`** — use structured logger
- **No `throw new Error(...)` in services** — use `throw this.error(...)`
- **No `/index` suffix in imports** — `@/common/css` not `@/common/css/index`
- **Max ~150 lines** per file
- **One component per file**
- **No inline styles in `.map()` callbacks** — extract to constants

---

## Rule 11: Data Flow Patterns

### External Services → Server → Client
```
External API (Grizzly/Fapshi)
  → src/services/xxx/client.ts (BaseService, typed, cached, retried)
  → app/api/*/route.ts (auth, validate, rate-limit, log, cache headers)
  → src/hooks/use-xxx.ts (React Query, initialData from RSC)
  → src/component/xxx/*.tsx (UI, useMemo/useCallback)
```

### Server Component → Client Component
```
app/[locale]/.../page.tsx (Server Component)
  → fetches initial data from DB
  → passes as props to src/component/xxx/*.tsx
  → Client Component uses React Query { initialData }
  → No loading spinner for first paint
```

---

## Rule 12: Security

- **Auth first** in every API route (requireSession / requireAdminSession)
- **Zod validation** on all inputs (query params + body)
- **Rate limit** on high-value endpoints (activations, purchases)
- **Audit log** for price access, purchases, admin actions
- **No sensitive data in logs** (API keys, SMS codes, OTPs)
- **Explicit SELECT** — never expose internal fields (apiKeyEncrypted, costUsd)
- **Request context** — every API route uses `extractRequestContext(req)`
- **Webhook auth** — verify `x-internal-webhook-secret` on all webhooks

---

## Rule 13: API Route Pattern

Every API route follows this pattern:

```typescript
import { NextResponse } from 'next/server'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireSession } from '@/common/auth/api-auth.server'

export async function POST(req: Request) {
  const ctx = extractRequestContext(req)

  try {
    // 1. Auth
    const session = await requireSession()
    const authed = withUser(ctx, session.user.id)

    // 2. Rate limit
    const key = getClientKey(session.user.id, req)
    const { allowed, retryAfterMs } = rateLimit(key)
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    // 3. Validate input (Zod)
    const input = schema.parse(await req.json())

    // 4. Business logic
    const result = await SomeService.doSomething(input)

    // 5. Audit log
    const log = createRequestLogger(req)
    log.info('action_complete', { ...toAuditEntry(authed, 'do', 'resource', 'success') })

    // 6. Response with cache headers
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=30' }
    })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
```

---

## Rule 14: Authentication Pattern

### Server-side auth:
```typescript
// Client API routes
import { requireSession } from '@/common/auth/api-auth.server'

// Admin API routes
import { requireAdminSession } from '@/common/auth/require-admin.server'

// Server Components
import { isServerAuthenticated } from '@/common/auth'
const isAuthenticated = await isServerAuthenticated()
```

### Client-side auth:
```typescript
import { signIn, signUp, signOut, useSession } from '@/common/auth/auth-client'
```

### Auth API route:
```typescript
// app/api/auth/[...all]/route.ts
import { auth } from '@/common/auth'
import { toNextJsHandler } from 'better-auth/next-js'
export const { GET, POST } = toNextJsHandler(auth)
```

---

## Rule 15: Environment Variables

All env vars are validated in `src/config/env.ts` using `@t3-oss/env-nextjs` + Zod.

```
.env              ← Actual secrets (git-ignored)
.env.example      ← Template without secrets
src/config/env.ts ← Zod validation (auto-throws on missing/invalid vars)
```

### Categories:
| Category | Variables |
|----------|-----------|
| Database | `DATABASE_URL`, `DIRECT_URL` |
| Auth | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| SMS | `GRIZZLY_API_KEY`, `SMSMAN_API_KEY` |
| Payments | `FAPSHI_API_KEY`, `FAPSHI_API_USER`, `FAPSHI_ENVIRONMENT` |
| Admin | `ADMIN_EMAILS`, `INTERNAL_API_SECRET` |
| Email | `EMAIL_PROVIDER`, `RESEND_API_KEY`, `SMTP_*` |
| Social | `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `FACEBOOK_CLIENT_ID/SECRET` |
| Client | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ENV` |

### No Stripe, no Polar, no LemonSqueezy — project uses only Fapshi for payments.
