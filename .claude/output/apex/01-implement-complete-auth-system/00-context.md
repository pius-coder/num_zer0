# APEX Task: 01-implement-complete-auth-system

**Created:** 2026-06-01
**Task:** implement complete auth system with anonymous quick access, conversion, and SSR support

## Flags
- Auto mode: true
- Save mode: true
- Economy mode: false
- Branch mode: false

## User Request
Implement a production-grade auth system using Better Auth + Convex with:
1. Permanent account (email/password)
2. Temporary 48h quick access (anonymous plugin)
3. Conversion from anonymous to permanent
4. Persistent banner showing remaining time
5. Strict expiration after 48h
6. Official Convex + Better Auth integration
7. TanStack Start SSR support

## Acceptance Criteria
- [ ] AC1: Better Auth configured with Convex component (convex.config.ts, auth.config.ts, auth.ts)
- [ ] AC2: Anonymous plugin enabled for quick access
- [ ] AC3: Email/password authentication for permanent accounts
- [ ] AC4: accessExpiresAt field on users with 48h TTL
- [ ] AC5: Server-side expiration enforcement in Convex queries/mutations
- [ ] AC6: Client auth setup (auth-client.ts, auth-server.ts)
- [ ] AC7: TanStack Start SSR integration (ConvexBetterAuthProvider, initialToken, beforeLoad)
- [ ] AC8: Auth API route proxy (/api/auth/$.ts)
- [ ] AC9: HTTP route registration on Convex side
- [ ] AC10: UI components: account type chooser, quick access modal, persistent banner, conversion page, expired page
- [ ] AC11: Schema with users table (betterAuthUserId, email, name, isAnonymous, accessExpiresAt, convertedAt, linkedPermanentUserId, createdAt, updatedAt)
- [ ] AC12: All Convex functions verify identity server-side via ctx.auth.getUserIdentity()
