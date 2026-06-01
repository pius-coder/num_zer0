# Implementation Plan: Complete Auth System with Anonymous Quick Access

## Overview
Implement Better Auth + Convex integration with anonymous plugin for 48h quick access, email/password permanent accounts, conversion flow, persistent time banner, and TanStack Start SSR support. Follow official `@convex-dev/better-auth` patterns exactly.

## Prerequisites
- [ ] Set `BETTER_AUTH_SECRET` env var on Convex via `npx convex env set`
- [ ] Set `SITE_URL` env var on Convex via `npx convex env set`

---

## File Changes (17 files, 12 new + 5 modified)

### Phase 1: Convex Backend (6 files)

#### `convex/convex.config.ts` (NEW)
- Register Better Auth component via `app.use(betterAuth)`
- Import from `@convex-dev/better-auth/convex.config`

#### `convex/auth.config.ts` (NEW)
- Export `getAuthConfigProvider()` as the sole provider
- Satisfies `AuthConfig` type

#### `convex/auth.ts` (NEW)
- Import `betterAuth` from `better-auth/minimal`
- Import `createClient` from `@convex-dev/better-auth`
- Import `convex` plugin from `@convex-dev/better-auth/plugins`
- Import `anonymous` plugin from `better-auth/plugins`
- Create `authComponent` via `createClient<DataModel>(components.betterAuth)`
- Create `createAuth(ctx)` factory with:
  - `baseURL` from `process.env.SITE_URL`
  - `database: authComponent.adapter(ctx)`
  - `emailAndPassword: { enabled: true, requireEmailVerification: false }`
  - Plugins: `convex({ authConfig })`, `anonymous({ emailDomainName: "numzer0.app" })`
- Export `getCurrentUser` query using `authComponent.getAuthUser(ctx)`

#### `convex/http.ts` (NEW)
- Create `httpRouter()`
- Register auth routes via `authComponent.registerRoutesLazy(http, createAuth, { cors: true })`
- Export default http

#### `convex/schema.ts` (MODIFY)
- Keep existing `products` and `todos` tables
- Add `users` table with fields:
  - `betterAuthUserId: v.string()`
  - `email: v.optional(v.string())`
  - `name: v.optional(v.string())`
  - `isAnonymous: v.boolean()`
  - `accessExpiresAt: v.optional(v.number())`
  - `convertedAt: v.optional(v.number())`
  - `linkedPermanentUserId: v.optional(v.string())`
  - `createdAt: v.number()`
  - `updatedAt: v.number()`
- Add indexes: `by_betterAuthUserId`, `by_email`

#### `convex/users.ts` (NEW)
- `getAccessStatus` query: verify identity, check `accessExpiresAt`, return `{ isExpired, remainingMs, user }`
- `convertToPermanent` mutation: verify identity, validate args (email, password, name), check not already converted, update user record
- `syncUser` mutation: upsert user from Better Auth webhook/session data
- All functions use `ctx.auth.getUserIdentity()` for server-side verification

### Phase 2: Client Auth Setup (2 files)

#### `src/lib/auth-client.ts` (NEW)
- Import `createAuthClient` from `better-auth/react`
- Import `convexClient` from `@convex-dev/better-auth/client/plugins`
- Import `anonymousClient` from `better-auth/client/plugins`
- Create auth client with both plugins
- Export `authClient`

#### `src/lib/auth-server.ts` (NEW)
- Import `convexBetterAuthReactStart` from `@convex-dev/better-auth/react-start`
- Call with `convexUrl` and `convexSiteUrl` from env
- Export `handler`, `getToken`, `fetchAuthQuery`, `fetchAuthMutation`, `fetchAuthAction`

### Phase 3: Routes (3 files)

#### `src/routes/api/auth/$.ts` (NEW)
- Create file route at `/api/auth/$`
- Proxy GET and POST to `handler` from auth-server
- Use `server.handlers` pattern

#### `src/routes/__root.tsx` (MODIFY)
- Import `ConvexBetterAuthProvider` from `@convex-dev/better-auth/react`
- Import `authClient` from `~/lib/auth-client`
- Import `getToken` from `~/lib/auth-server`
- Add `beforeLoad` to root route that calls `getToken()` and stores in loaderData
- Replace `AppConvexProvider` with `ConvexBetterAuthProvider` passing `authClient` and `initialToken`
- Pass `convexQueryClient` through router context

#### `src/router.tsx` (MODIFY)
- Add `token` to router context type
- Remove duplicate ConvexProvider in `Wrap` (let `__root.tsx` handle it)
- Export `convexQueryClient` for use in root route
- Add `context: { queryClient, token: undefined }` as default

### Phase 4: UI Components (6 files)

#### `src/components/auth/account-type-chooser.tsx` (NEW)
- Two cards: "Compte permanent" and "Accès rapide 48h"
- Permanent: redirect to signup page
- Quick access: call `authClient.signIn.anonymous()`, then show modal

#### `src/components/auth/quick-access-modal.tsx` (NEW)
- Modal showing session info after anonymous sign-in
- Display: "Votre accès expires le [date]"
- Button to continue to app
- Uses `authClient.useSession()` for session state

#### `src/components/auth/access-banner.tsx` (NEW)
- Persistent banner at top of app
- Shows remaining time countdown
- Color-coded by urgency:
  - Green: >24h remaining
  - Yellow: <24h remaining
  - Red: <2h remaining
- Uses `useQuery` with `convexQuery(api.users.getAccessStatus, {})`
- Auto-refreshes every 60s

#### `src/components/auth/convert-page.tsx` (NEW)
- Form with: name, email, password, confirm password
- Validates inputs client-side
- Calls `authClient.signUp.email({ email, password, name })` to create permanent account
- Then calls `convexMutation(api.users.convertToPermanent, {})` to link data
- Redirects to app on success

#### `src/components/auth/expired-page.tsx` (NEW)
- Message: "Votre accès a expiré"
- CTA: "Créer un compte permanent"
- Option: "Retour à l'accueil"

#### `src/components/auth/hooks/use-access-timer.ts` (NEW)
- Hook that polls `getAccessStatus` query
- Returns `{ remainingMs, isExpired, urgencyLevel }`
- urgencyLevel: 'safe' | 'warning' | 'critical'

### Phase 5: Env Setup

#### Set environment variables on Convex
- `npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)`
- `npx convex env set SITE_URL=http://localhost:3000` (dev)

---

## Acceptance Criteria Mapping
- [ ] AC1: `convex/convex.config.ts` + `convex/auth.config.ts` + `convex/auth.ts`
- [ ] AC2: Anonymous plugin in `convex/auth.ts` + `src/lib/auth-client.ts`
- [ ] AC3: `emailAndPassword` in `createAuth` + `authClient.signUp.email`
- [ ] AC4: `accessExpiresAt` in `convex/schema.ts` users table
- [ ] AC5: `getAccessStatus` query in `convex/users.ts`
- [ ] AC6: `src/lib/auth-client.ts` + `src/lib/auth-server.ts`
- [ ] AC7: `ConvexBetterAuthProvider` + `initialToken` in `__root.tsx`
- [ ] AC8: `src/routes/api/auth/$.ts`
- [ ] AC9: `convex/http.ts` with `registerRoutesLazy`
- [ ] AC10: All UI components in `src/components/auth/`
- [ ] AC11: Users table in `convex/schema.ts`
- [ ] AC12: All Convex functions use `ctx.auth.getUserIdentity()`

## Risks & Considerations
- Self-hosted Convex: Ensure `BETTER_AUTH_SECRET` is set via CLI, not .env.local
- Duplicate ConvexProvider: Must consolidate in `__root.tsx` only
- `expectAuth: true` gotcha: Reload page on sign out to avoid stale auth state
- 48h TTL: Must be enforced server-side, not just UI countdown
