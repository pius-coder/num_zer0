# Step 1: Analyze — Context Gathering Complete

## Codebase Context

### Related Files Found
| File | Lines | Contains |
|------|-------|----------|
| `convex/schema.ts` | 1-35 | Current schema (products, todos tables — no auth) |
| `convex/convex.config.ts` | does NOT exist | Must create — component registration |
| `convex/auth.config.ts` | does NOT exist | Must create — auth config provider |
| `convex/auth.ts` | does NOT exist | Must create — Better Auth instance |
| `convex/http.ts` | does NOT exist | Must create — HTTP router with auth routes |
| `convex/todos.ts` | 1-100 | Existing mutations — no auth checks (public) |
| `src/router.tsx` | 1-80 | Router + QueryClient + ConvexProvider (duplicate setup) |
| `src/routes/__root.tsx` | 1-120 | Root shell with AppConvexProvider |
| `src/routes/(app)/app.tsx` | 1-60 | App SPA route (ssr: false) |
| `src/routes/(landing)/index.tsx` | 1-50 | Landing page |
| `src/common/provider/convex-provider.tsx` | 1-20 | ConvexQueryClient + ConvexProvider wrapper |
| `src/lib/utils.ts` | 1-10 | cn() utility |
| `src/routes/api/auth/$.ts` | does NOT exist | Must create — auth route proxy |
| `src/lib/auth-client.ts` | does NOT exist | Must create — client auth |
| `src/lib/auth-server.ts` | does NOT exist | Must create — server auth utilities |

### Dependencies Installed
| Package | Version | Status |
|---------|---------|--------|
| `@convex-dev/better-auth` | ^0.12.2 | ✅ Installed |
| `better-auth` | ~1.6.9 | ✅ Installed |
| `convex` | ^1.39.1 | ✅ Installed |
| `@tanstack/react-start` | latest | ✅ Installed |
| `@tanstack/react-router` | latest | ✅ Installed |
| `@convex-dev/react-query` | 0.1.0 | ✅ Installed |

### Patterns Observed
- **Convex + React Query**: Uses `convexQuery()` descriptors, `useConvexMutation().withOptimisticUpdate()` pattern
- **File-based routing**: TanStack Router with route groups `(landing)` and `(app)`
- **shadcn UI**: base-nova style, lucide icons, CVA variants
- **Feature folder pattern**: `components/<feature>/docs/`, `hooks/`, barrel exports
- **Max 200 lines per file** enforced by ESLint
- **Dual ConvexProvider**: Both `__root.tsx` (AppConvexProvider) and `router.tsx` (Wrap) create ConvexQueryClient — redundant, needs cleanup

### Environment
- Self-hosted Convex on `api-bpsd.globalimex.online`
- AWS EC2 instance for site hosting
- No `BETTER_AUTH_SECRET` or `SITE_URL` env vars set yet

### Key Research Findings
- Official integration: `betterAuth/minimal` in Convex functions, `createClient` for component access
- Anonymous plugin: adds `isAnonymous` field, `onLinkAccount` callback for data migration
- `convexBetterAuthReactStart`: returns `handler`, `getToken`, `fetchAuthQuery`, `fetchAuthMutation`
- SSR: `ConvexBetterAuthProvider` with `initialToken` from `getToken()` in `beforeLoad`
- HTTP routes: `authComponent.registerRoutesLazy(http, createAuth)` for production
- Env vars: `BETTER_AUTH_SECRET` and `SITE_URL` must be set via `npx convex env set`
- Gotcha: `expectAuth: true` + sign out can cause errors — reload page on sign out

## Inferred Acceptance Criteria
- [x] AC1: Better Auth configured with Convex component
- [x] AC2: Anonymous plugin enabled
- [x] AC3: Email/password for permanent accounts
- [x] AC4: accessExpiresAt with 48h TTL
- [x] AC5: Server-side expiration enforcement
- [x] AC6: Client auth (auth-client.ts, auth-server.ts)
- [x] AC7: TanStack Start SSR integration
- [x] AC8: Auth API route proxy
- [x] AC9: HTTP route registration
- [x] AC10: UI components
- [x] AC11: Schema with users table
- [x] AC12: All functions verify identity server-side

→ Proceeding to planning phase...
