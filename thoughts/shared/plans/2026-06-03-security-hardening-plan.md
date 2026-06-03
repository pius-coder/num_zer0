---
title: "Security Hardening & Audit Remediation — Implementation Plan"
source: "thoughts/shared/designs/2026-06-03-pre-deployment-security-hardening-design.md"
status: ready
batches: 4
---

## Dependency Map

```
Batch 1 (Foundation — 3 parallel)
├── M1: convex/lib/auth-helpers.ts (NEW)
├── M2: convex/schema.ts (add reference field)
└── M3: convex/auth.ts (fix admin logic)

Batch 2 (Core Guards — 3 parallel, depends on Batch 1)
├── M4: convex/users.ts (syncUser→internal, auth guards, admin fix, balanceUsd removal)
├── M5: convex/comptabilite.ts (auth guards, overdraft protection)
└── M6: convex/analytics.ts (auth guard + eventType whitelist)

Batch 3 (Complex Logic — 2 parallel, depends on Batch 2)
├── M7: convex/purchases.ts (applyPaymentCredit, race fix, promo fix, balanceUsd fix)
└── M8: convex/sms_provider.ts (escrow dedup, max retries, provider guard, auth guards)

Batch 4 (Verification — sequential)
└── M9: stage+commit, convex dev, typecheck, build, test
```

**Total: 8 micro-tasks across 8 files. 1 verification task. 4 batches.**

---

## Batch 1 — Foundation (3 parallel tasks)

### M1: Create `convex/lib/auth-helpers.ts`
**Depends on:** nothing
**Files created:** `convex/lib/auth-helpers.ts`
**Files modified:** none
**Verification:** `bun run typecheck` passes

Implementation:
```typescript
// convex/lib/auth-helpers.ts
import { type QueryCtx, type MutationCtx } from '../_generated/server'

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  return identity
}

export async function requireAdmin(ctx: MutationCtx) {
  const identity = await requireAuth(ctx)
  const user = await ctx.db
    .query('users')
    .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', identity.subject))
    .unique()
  if (!user?.isAdmin) throw new Error('Unauthorized: admin access required')
  return { identity, user }
}
```

### M2: Add `reference` field to `pieces` table
**Depends on:** nothing
**Files modified:** `convex/schema.ts`
**Verification:** `bun run typecheck` passes

Changes:
- Add `reference: v.optional(v.string())` to the `pieces` defineTable
- Add index: `.index('by_reference', ['reference'])`

### M3: Fix admin auto-assignment in `auth.ts`
**Depends on:** nothing
**Files modified:** `convex/auth.ts`
**Verification:** `bun run typecheck` passes

Changes:
- Remove `usersCount === 0` condition (line 32)
- Remove `user.email === 'admin@gmail.com'` condition
- Keep only `user.email?.endsWith('@numzero.com')` for admin detection
- Update `syncUserDb` call to use `internal.users.syncUser` instead of `api.users.syncUser`
- Remove unused `(ctx as any)` casts if possible, or minimize them

---

## Batch 2 — Core Guards (3 parallel, depends on Batch 1)

### M4: Harden `convex/users.ts`
**Depends on:** M1, M3
**Files modified:** `convex/users.ts`
**Verification:** `bun run typecheck` passes, tests pass

Changes:
1. Import `{ requireAuth }` from `./lib/auth-helpers`
2. Convert `syncUser` → `internalMutation` (line 62 `mutation` → `internalMutation`)
3. Add `requireAuth` guard to `checkUserExists` (line 195)
4. Remove `usersCount === 0` admin condition (line 83) — matching M3
5. Remove `balanceUsd: 0` set in `internalCreateUser` (line 107) — stop writing phantom field
6. After conversion to internalMutation, update any callers to use `internal.users.syncUser`

### M5: Harden `convex/comptabilite.ts`
**Depends on:** M1
**Files modified:** `convex/comptabilite.ts`
**Verification:** `bun run typecheck` passes

Changes:
1. Import `{ requireAuth }` from `./lib/auth-helpers`
2. Add `requireAuth` + ownership guard to `soldeClient` (line 178) — `userId === identity.subject`
3. Add `requireAuth` + scope to own `411-{identity.subject}` to `getCompte` (line 21)
4. Add `requireAuth` + scope to own `411-{identity.subject}` to `getMouvements` (line 148)
5. Add overdraft check to `debitCompte` (line 55-67):
   ```
   if (compte.solde < args.montant) throw new Error(`Solde insuffisant...`)
   ```

### M6: Harden `convex/analytics.ts`
**Depends on:** M1
**Files modified:** `convex/analytics.ts`
**Verification:** `bun run typecheck` passes

Changes:
1. Import `{ requireAuth }` from `./lib/auth-helpers`
2. Add `requireAuth` guard to `trackEvent` (line 4)
3. Add `eventType` whitelist validation: `['click_buy', 'click_services', 'page_leave', 'page_view', 'phone_country_selected', 'service_selected']`

---

## Batch 3 — Complex Logic (2 parallel, depends on Batch 2)

### M7: Fix `convex/purchases.ts` — payment race, promo race, balanceUsd, idempotency
**Depends on:** M1, M2, M4, M5
**Files modified:** `convex/purchases.ts`
**Verification:** `bun run typecheck` passes

Changes (surgical — file is 493 lines, over 200 limit, add minimal code):
1. Import `{ requireAuth }` from `./lib/auth-helpers`
2. Add `requireAuth` to `validatePromoCode` (line 58)
3. **New mutation `applyPaymentCredit`** — atomic payment processing:
   - Takes `purchaseId: v.id('purchases')`
   - Reads purchase, returns if already confirmed (first-writer-wins idempotency)
   - Checks if piece with `reference = payment-{purchaseId}` exists → skip if yes
   - Creates piece (`411-user` / `701-recharge`), patches purchase, updates user deposit flags
4. **Fix `verifyPurchase` action** (line 370): Replace inline accounting logic with `ctx.runMutation(internal.purchases.applyPaymentCredit, { purchaseId })`
5. **Fix `handlePaymentSuccess` mutation** (line 77): Replace inline accounting with same `applyPaymentCredit` call
6. **Fix promo race** (line 319):
   - Remove `internalIncrementPromo` call from `initiateDirectPay`
   - Move increment logic into `applyPaymentCredit` (after payment confirmed)
   - Add `internalDecrementPromo` rollback in catch block
7. **Remove `balanceUsd` writes** in `internalCreateUser` (line 264) and `handlePaymentSuccess` (line 103)
8. Convert `internalIncrementPromo`, `internalPatchPurchase`, `internalUpdateUserDeposit` from `mutation` → `internalMutation`

### M8: Fix `convex/sms_provider.ts` — auth guards, escrow dedup, max retries, provider guard
**Depends on:** M1, M2, M5
**Files modified:** `convex/sms_provider.ts`
**Verification:** `bun run typecheck` passes

Changes (surgical — file is 600 lines):
1. Import `{ requireAuth }` from `./lib/auth-helpers`
2. Add `requireAuth` to `getNumberQuantity` (line 521) and `getTopCountries` (line 549)
3. **Escrow refund idempotency** in `refundEscrow` (line 310):
   - Before creating refund piece, query pieces by reference `refund-{activationId}`
   - If exists, return early (already refunded)
   - Set `reference: 'refund-' + activationId` on the refund piece
4. **Activation completion idempotency** (line 375):
   - Before creating completion piece, query by reference `complete-{activationId}`
   - Set `reference: 'complete-' + activationId`
5. **Provider cost guard** (line 369): Add `if (providerCost > priceCharged)` throw before creating piece
6. **`pollActivation` max retries** (line 253 catch block):
   - Add `MAX_RETRIES = 30` constant
   - Track retry count on activation document
   - After max retries: mark expired, call `refundEscrow`
7. **New mutation `adminRefundActivation`** — admin-only force refund for stuck escrow
8. **Escrow setup idempotency** in `initiateActivation` (line 116): set `reference: 'escrow-' + activationId`

---

## Batch 4 — Verification (sequential)

### M9: Stage, commit, build, test
**Depends on:** M1-M8 complete
**Files modified:** none (git operations)
**Verification:** `bun run build` succeeds

Steps:
1. Stage all modified files + the 19 untracked SMS integration files
2. `npx convex dev --once` to regenerate API bindings
3. `bun run typecheck` — must pass
4. `bun run build` — must succeed
5. Run all existing tests
6. Commit with message: `fix: security hardening & audit remediation`

---

## File Change Summary

| File | Change Type | Lines Changed | Batch |
|------|-------------|---------------|-------|
| `convex/lib/auth-helpers.ts` | **NEW** | ~20 lines | 1 |
| `convex/schema.ts` | 2 lines | +2 | 1 |
| `convex/auth.ts` | ~5 lines | -2/+3 | 1 |
| `convex/users.ts` | ~15 lines | ~10 changed | 2 |
| `convex/comptabilite.ts` | ~25 lines | ~20 changed | 2 |
| `convex/analytics.ts` | ~8 lines | +8 | 2 |
| `convex/purchases.ts` | ~60 lines | ~40 changed | 3 |
| `convex/sms_provider.ts` | ~60 lines | ~45 changed | 3 |

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `syncUser` → `internalMutation` breaks auth flow | Low | `auth.ts` calls via `internal.users.syncUser` — must match exact import path |
| `applyPaymentCredit` double-processes due to Convex OCC retry | Low | Piece-by-reference check is the belt+suspenders guard |
| Overdraft guard breaks legitimate flow | Low | Only triggers if there's already a bug — it's a safety net |
| SMS provider module fails to compile | Medium | Must run `convex dev` before build to regenerate `_generated/api.d.ts` |
| `as any` casts in auth.ts break | Low | These are existing and not being removed — only the admin logic changes |
