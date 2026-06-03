---
date: 2026-06-03
topic: "Pre-deployment Security Hardening & Audit Remediation"
status: validated
---

## Problem Statement

A full codebase audit (2026-06-03) revealed **21 security findings** (2 CRITICAL, 6 HIGH) and **10 accounting/financial findings** (2 CRITICAL, 3 HIGH) in the Convex backend. Additionally, the SMS Online Pro integration (Phase 1) is complete on disk but **untracked and uncompilable** — 19 files exist but will break TypeScript until `npx convex dev` regenerates the API bindings.

**Bottom line:** Deploying the current code risks:
- Any user reading any other user's balance (IDOR)
- Any client calling `syncUser` to escalate privileges
- Double-crediting user accounts via webhook/action race
- Promo codes exceeding their max uses
- Accounts going negative without guard
- Stuck escrow with no admin escape hatch

**We fix all of these before deployment — and we do it with a unified pattern, not ad-hoc patches.**

## Constraints

- **Convex-first** — all fixes must work within Convex's mutation/query/action model and serializable isolation guarantees
- **No new external dependencies** — zero new npm packages for this work
- **Backward-compatible** — no breaking changes to existing client API signatures
- **Minimal migration** — ideally zero data migrations. Any schema changes must be additive only (widen, don't narrow)
- **SMS integration stays untracked** — we're hardening the foundation first; SMS files can be committed after this design is implemented
- **TanStack Query client pattern** — authenticated queries use `convexQuery` wrappers; mutations go through `useConvexMutation` with optimistic updates

## Approach

**I considered three approaches:**

1. **Ad-hoc per-file fixes** — fastest, but creates inconsistency (one file uses `internalMutation`, another adds auth guard inline, another uses a helper). Rejected because it makes the next audit harder and the patterns diverge.

2. **Centralized auth guard decorator** — a reusable `requireAuth` wrapper that any mutation/query can call. This is my chosen approach. It's a few lines, consistent, and easy to audit. Every public mutation/query that touches user data calls `requireAuth(ctx)` at the top. Internal functions use `internalMutation` which doesn't need it.

3. **Route-level middleware in Convex** — Convex doesn't have native middleware, and hacking it via a wrapper factory overcomplicates things. A simple `requireAuth` helper is cleaner.

**For the accounting fixes**, I considered moving to integer cents everywhere but that's a cross-cutting change touching schema, comptabilite, purchases, users, and frontend. Instead, I'll add the critical guards (overdraft protection, providerCost check, piece-by-reference dedup) without changing the data type. The integer-cent migration becomes a separate follow-up.

## Architecture

The fix architecture layers on four patterns:

```
┌──────────────────────────────────────────────────┐
│                  Pattern 1                        │
│          requireAuth(ctx) guard helper            │
│    (convex/lib/auth-helpers.ts — new file)       │
├──────────────────────────────────────────────────┤
│                  Pattern 2                        │
│    internalMutation for backend-only functions    │
│    (syncUser, backfillComptes, etc.)              │
├──────────────────────────────────────────────────┤
│                  Pattern 3                        │
│    Atomic operations via single-mutation crt section│
│    (fix promo race, verifyPurchase async safety)  │
├──────────────────────────────────────────────────┤
│                  Pattern 4                        │
│    Idempotency via piece-by-reference dedup       │
│    (webhooks, escrow refund double-execution)    │
└──────────────────────────────────────────────────┘
```

**New file:** `convex/lib/auth-helpers.ts` — contains `requireAuth()` and `requireAdmin()` helpers.

No new Convex tables needed. One field addition to the `pieces` table: an optional `reference` string for dedup checking.

## Components

### 1. Auth Guard Layer (`convex/lib/auth-helpers.ts`)

**`requireAuth(ctx)`** — takes a mutation/query context, calls `ctx.auth.getUserIdentity()`, returns the identity or throws `Unauthenticated`.

**`requireAdmin(ctx)`** — calls `requireAuth`, then `ctx.db.get` the user doc and checks `isAdmin === true`.

**Usage contract:** Every public mutation/query that accesses user-scoped data starts with:
```typescript
const identity = requireAuth(ctx)
```

Functions that are only called from other Convex functions (never from the client) use `internalMutation` instead — they don't need the guard because the caller already authenticated.

### 2. Functions to Convert to `internalMutation`

| Current Function | File:Line | Why |
|-----------------|-----------|-----|
| `syncUser` | users.ts:62 | Only ever called from `auth.ts:60` |
| `backfillComptes` | purchases.ts:462 | Admin/internal-only accounting repair |
| `internalPatchPurchase` | purchases.ts:196 | Already named "internal" but uses `mutation` not `internalMutation` |
| `internalUpdateUserDeposit` | purchases.ts:271 | Same — naming mismatch |
| `internalIncrementPromo` | purchases.ts:233 | Same — naming mismatch |

### 3. Functions to Add Auth Guards To (public mutations/queries)

| Function | File | Guard type |
|----------|------|------------|
| `checkUserExists` | users.ts:195 | `requireAuth` |
| `getCompte` | comptabilite.ts:21 | `requireAuth` + scope to own `411-{subject}` |
| `getMouvements` | comptabilite.ts:148 | `requireAuth` + scope to own `411-{subject}` |
| `soldeClient` | comptabilite.ts:178 | `requireAuth` + enforce `userId === subject` |
| `validatePromoCode` | purchases.ts:58 | `requireAuth` |
| `trackEvent` | analytics.ts:4 | `requireAuth` + validate eventType whitelist |
| `getNumberQuantity` | sms_provider.ts:521 | `requireAuth` + rate limit |
| `getTopCountries` | sms_provider.ts:549 | `requireAuth` + rate limit |

### 4. Admin Auto-assignment Fix

**Problem:** `usersCount === 0` makes the first user admin (duplicated in `auth.ts:32` and `users.ts:83`).

**Fix:** Remove the `usersCount === 0` condition from both locations. Replace with an `ADMIN_EMAILS` env var (comma-separated) checked at sync time. Fallback: if the env var is missing, `isAdmin` is only true for `@numzero.com` emails. This means the first user to register with an `@numzero.com` email becomes admin — the intended bootstrap path.

### 5. Accounting Hardening

#### Overdraft Protection
Add to `debitCompte` (`comptabilite.ts:55-67`):
```typescript
if (compte.solde < args.montant) {
  throw new Error(`Solde insuffisant: ${compte.code} a ${compte.solde}, besoin de ${args.montant}`)
}
```

#### Provider Cost Guard
Add to `completeActivation` completion piece creation (`sms_provider.ts:369-385`):
```typescript
if (providerCost > priceCharged) {
  // Escrow can't cover provider cost — this is a system error, not user error
  throw new Error(`Provider cost ${providerCost} > charged ${priceCharged} for activation ${activation._id}`)
}
```

#### verifyPurchase → webhook Race Fix
The root cause is `verifyPurchase` is an **action** that reads `purchase.status` and then makes decisions, but a concurrent mutation can change the status between read and write.

**Fix:** Instead of `verifyPurchase` doing the accounting work itself, it delegates to a single new mutation `applyPaymentCredit` that atomically:
1. Reads purchase status (throws if already confirmed)
2. Marks purchase as confirmed
3. Creates the accounting piece (guarded by idempotency check)
4. Updates user deposit flags

The action only calls `ctx.runMutation(internal.purchases.applyPaymentCredit, ...)`. Convex's serializable isolation guarantees this runs atomically.

#### Promo Code Race Fix
Move `internalIncrementPromo` from before the Fapshi API call to after successful payment confirmation. Add a rollback in the catch block:
```typescript
catch (err) {
  await ctx.runMutation(internal.purchases.internalDecrementPromo, { promoId })
  throw err
}
```

#### Escrow Refund Double-Execution Guard
In `refundEscrow` (sms_provider.ts:310-339), before creating the refund piece, check if a piece with `reference = 'refund-' + activationId` already exists. This is the same **piece-by-reference dedup** pattern from Pattern 4.

#### pollActivation Max Retries
Add `MAX_RETRIES = 30` constant. In the catch block, increment a `retryCount` field on the activation. If exceeded, mark as `expired` and call `refundEscrow`. Add an `adminRefundActivation` mutation for manual intervention.

### 6. Idempotency / Dedup Strategy

**Single pattern used everywhere:** Before creating any financial `piece`, check if a piece with the same `reference` field already exists.

| Scenario | Reference Value |
|----------|----------------|
| Webhook recharge | `payment-{purchaseId}` |
| Action recharge | `payment-{purchaseId}` (same — first writer wins) |
| Escrow setup | `escrow-{activationId}` |
| Escrow refund | `refund-{activationId}` |
| Activation completion | `complete-{activationId}` |

**Schema change:** Add optional `reference: v.optional(v.string())` to the `pieces` table definition in schema.ts. Index it with `.index('by_reference', ['reference'])`.

### 7. Phantom `balanceUsd` Remediation

**Two-phase approach:**

**Phase A (immediate, no migration):** Remove `balanceUsd` from all reads in the codebase. The canonical balance is `comptes.solde` accessed via `getUserBalance`. Update `internalCreateUser` to not set `balanceUsd` at all. This means no data migration — we just stop using the field.

**Phase B (follow-up):** After deployment stabilizes, drop the field from the schema. This is a schema change that requires the widen-ignore-narrow pattern. Out of scope for this design.

## Data Flow

### Before (broken — verifyPurchase double-processes)

```
User browser                  Fapshi webhook
    │                              │
    ▼                              ▼
verifyPurchase (ACTION)    handlePaymentSuccess (MUTATION)
    │                              │
    ├─ read purchase.status         ├─ read purchase.status
    ├─ createPiece                  ├─ createPiece  ← BOTH CREATE
    ├─ patch purchase               ├─ patch purchase ← BOTH PATCH
    └─ return                      └─ return
         ↑                                  ↑
   User credited twice              User credited twice
```

### After (atomic — single mutation processes payment)

```
User browser                  Fapshi webhook
    │                              │
    ▼                              ▼
verifyPurchase (ACTION)    handlePaymentSuccess (MUTATION)
    │                              │
    └─ runMutation(                 └─ calls internally ─┐
         applyPaymentCredit)              │              │
         ┌───────────────────────────────┘              │
         ▼                                              │
  applyPaymentCredit (MUTATION — atomic) ◄──────────────┘
         │
         ├─ read purchase.status
         ├─ if confirmed → return (first writer wins)
         ├─ check piece by reference exists → skip if yes
         ├─ createPiece + patch purchase
         └─ done
```

## Error Handling

| Scenario | Error Type | User-Facing Behavior |
|----------|-----------|---------------------|
| Unauthenticated call to guarded function | `ConvexError("Unauthenticated")` | Route redirect to auth-splash |
| Overdraft on debit | `ConvexError("Solde insuffisant...")` | Toast "Solde insuffisant" |
| Provider cost exceeds charged | `ConvexError("Provider cost ...")` | Internal error toast, activation marked failed |
| Duplicate webhook (idempotency) | Silent return | No user-facing impact — piece already exists |
| Promo code already consumed | `ConvexError("Code promo déjà utilisé")` | Toast + disable promo field |
| pollActivation max retries exceeded | Activation → expired, escrow refunded | User sees activation in "expired" state |

## Testing Strategy

### Unit-level (Convex function tests via `convex/test/`)

| Test | What It Verifies |
|------|-----------------|
| `requireAuth` rejects unauthenticated calls | Call without identity → throws |
| `requireAdmin` rejects non-admin calls | Call with non-admin identity → throws |
| `debitCompte` rejects overdraft | Debit > balance → throws |
| `applyPaymentCredit` idempotency | Call twice → only one piece created |
| `refundEscrow` idempotency | Call twice → only one refund piece created |
| Promo increment after payment | Promo usedCount unchanged if Fapshi call fails |
| Auth guard on every public function | Each public mutation/query → test with and without identity |
| Admin auto-assignment | First user with @numzero.com → admin; first user without → not admin |

### Integration-level

| Test | What It Verifies |
|------|-----------------|
| Full recharge flow | Fapshi callback → piece created → balance updated |
| Concurrent webhook replay | Two simultaneous webhooks → single credit |
| SMS activation → escrow → complete | Full lifecycle creates balanced pieces |
| SMS activation → cancel → refund | Cancel releases escrow correctly |
| Route guard bypass | Unauthenticated user redirected from /wallet, /recharge, /my-space |

### Pre-deployment checklist

1. [ ] All `internalMutation` conversions done (4 functions)
2. [ ] All auth guards added (8 functions)
3. [ ] Admin auto-assignment fix deployed (phase: set ADMIN_EMAILS env var)
4. [ ] Overdraft protection added to `debitCompte`
5. [ ] Provider cost guard added
6. [ ] `applyPaymentCredit` mutation created and wired
7. [ ] Promo race condition fixed (increment after payment)
8. [ ] Escrow refund idempotency guard added
9. [ ] `pollActivation` max retries + admin refund added
10. [ ] `reference` index added to pieces schema
11. [ ] `balanceUsd` reads removed from codebase
12. [ ] All 19 untracked files staged
13. [ ] `npx convex dev` run to regenerate API bindings
14. [ ] `bun run typecheck` passes
15. [ ] `bun run build` succeeds

## Open Questions

1. **Should `internalPatchPurchase` get a proper typed schema or stay `v.any()`?** Typed is safer but more verbose. Decision: typed schema with explicit allowed fields — the patch surface is small (status updates only, a few fields).

2. **`ADMIN_EMAILS` env var or stick with `@numzero.com` domain check?** The domain check is already in place and sufficient for bootstrap. The env var adds deploy-time config overhead. Decision: keep the domain check, remove `usersCount === 0` and `admin@gmail.com` hardcode. If we need super-admin later, we add the env var then.

3. **Integer cents migration — now or follow-up?** Now is technically correct but adds 10+ files of churn to this already-large change. Decision: follow-up. The critical guards (overdraft, race fixes) handle the real money-safety issues. Penny rounding is a long-term concern.

4. **Should `verifyPurchase` be deleted entirely and rely solely on the webhook?** The webhook is the source of truth, but the action handles the case where the webhook hasn't fired yet (user returns to the app before the webhook arrives). Decision: keep both, fix the race with the atomic mutation. The first writer wins pattern is correct here.
