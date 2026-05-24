# num_zer0 — SMS Activation Platform

Next.js 16 (App Router) · Bun 1.2 · PostgreSQL + Drizzle ORM · Better-Auth · TailwindCSS 4
Payments: Fapshi only (no Stripe/Polar/LemonSqueezy). SMS: GrizzlySMS + SMSMan.

## Commands

| Command | Purpose |
|---------|---------|
| `bun dev` | Dev server (Turbopack) |
| `bun build` | Production build |
| `bun run typecheck` | `tsc --noEmit --pretty` |
| `bun run lint` | Biome lint |
| `bun run format` | Biome format |
| `bun run migrate` | Run Drizzle migrations |
| `bun run seed` | Seed DB |
| `bun run generate-migration` | `drizzle-kit generate` |

## Directory Structure

```
app/                          ← Routing ONLY (page.tsx, layout.tsx, route.ts)
  [locale]/                   ← i18n routes (fr/en/es)
    (main)/                   ← Protected SPA pages (auth guard via proxy.ts + layout)
      [...spa]/page.tsx       ← React Router v7 SPA (BrowserRouter)
    (auth)/                   ← Login, reset-password, verify
  api/                        ← API routes
  _styles/                    ← CSS only
  _components/                ← Static Server Components only (NO 'use client')
src/
  component/                  ← All interactive components (kebab-case files, PascalCase exports)
    ui/                       ← Primitives (button, badge, skeleton, theme-switcher, etc.)
    numbers/                  ← Services + activations feature components
    wallet/                   ← Credits + transactions
    spa/                      ← SPA page components (my-space, wallet, account)
    landing/                  ← Landing page components
    recharge/                 ← Recharge drawer/buttons
    layout/                   ← Headers, bottom-nav, mobile-header
  services/                   ← OOP business logic (extends BaseService)
    base.service.ts           ← BaseService (log, db, http, retry, transaction, generateId, assert, error)
    grizzly/                  ← GrizzlySMS client
    fapshi/                   ← Fapshi payment client
  common/                     ← Shared utilities (NO business logic)
    auth/                     ← Better-Auth (auth.ts, auth-client.ts, get-server-session.ts, etc.)
    result/                   ← Result<T,E> pattern
    logger/                   ← Structured logger
    css.ts                    ← cn() utility
  database/                   ← Drizzle schema + DB connection
    schemas/                  ← auth, credits, services, activations, payments, governance, etc.
  hooks/                      ← React Query hooks per domain
  actions/                    ← Server Actions (xxx.action.ts pattern)
  middleware/                 ← rate-limit, error-handler, request-context
  type/                       ← Shared TS types (api, service, credit, provider, common)
  config/env.ts               ← Zod env validation (@t3-oss/env-nextjs)
proxy.ts                      ← Next.js 16 middleware: i18n + auth guard (cookie check)
drizzle/                      ← Migrations + seed + fix-columns
```

## Naming & Code Rules

- `app/`: no `'use client'`, no business logic, no hooks
- `app/_components/`: server-only static layout shells — NEVER add `'use client'`
- `src/component/`: one component per file, max ~150 lines
- Services: extend `BaseService`, throw via `this.error()` / `this.assert()`, never `throw new Error()`
- No `any`, no `SELECT *`, no `console.*` (use logger), no `/index` suffix in imports
- Import: `@/common/css` not `@/common/css/index`; `@/*` = `src/*`, `@/app/*` = `app/*`

## Auth

- Middleware (`proxy.ts`): guards protected routes (`/my-space`, `/dashboard`, `/account`) via cookie check
- `(main)/layout.tsx`: server component, calls `getServerSession()` (cached), redirects if no session
- API routes: `requireSession()` or `requireAdminSession()` first
- Auth API: `app/api/auth/[...all]/route.ts` → `toNextJsHandler(auth)`

## SPA Architecture

Pages under `(main)/[...spa]/` use React Router v7 (`BrowserRouter` with `basename=/${locale}`).
All SPA paths (`my-space`, `wallet`, `account`, `numbers`, `recharge`, `support`) have explicit identity rewrites in `next.config.ts` to prevent catch-all redirect conflicts.
Route links use paths relative to basename (`/my-space`, not `/${locale}/my-space`).

## API Route Pattern

Every route: auth → rate-limit → Zod validate → business logic → audit log → cached response.
Handle errors via `handleError(err, requestId)` from `@/middleware/error-handler`.

## Security

- Auth first on every API route (requireSession / requireAdminSession)
- Zod on all inputs, rate-limit high-value endpoints
- Audit log for purchases, admin actions, price access
- Explicit SELECT (never expose apiKeyEncrypted, costUsd)
- `x-internal-webhook-secret` on webhooks, `extractRequestContext()` for request ID

## Memory

- **`.memory/context.md`** (tracked): persistent project context — lire au début de chaque session pour restaurer l'état complet
- **`.memory/secrets*`** (gitignored): tokens, clés API, secrets divers
- Écrire dans `context.md` les décisions importantes, bugs résolus, état d'avancement pour persistance inter-sessions

## Theme

CSS: `:root` = light (default), `.dark` = dark. `next-themes` with `enableSystem`, `attribute='class'`.
`next.config.ts` has CSP headers.
